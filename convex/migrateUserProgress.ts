import { mutation } from './_generated/server'
import { v } from 'convex/values'

// Migration utility: maps legacy numeric lesson indexes saved in
// `userProgress.lastPlaybackTime.lessonIndex` to stable `lessonId` values.
// - Protected by a secret (`MIGRATE_USER_PROGRESS_SECRET`) to avoid accidental runs
// - Supports `dryRun` to preview changes
// - Processes documents in batches

export const migrateUserProgress = mutation({
  args: {
    migrationSecret: v.string(),
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
    // Optional filter to only migrate progress for a single course
    courseId: v.optional(v.id('courses')),
    // Legacy indexing mode: 'flattened' (default) or 'module_scoped'
    legacyMode: v.optional(v.union(v.literal('flattened'), v.literal('module_scoped')))
  },
  handler: async (ctx, args) => {
    const secret = process.env.MIGRATE_USER_PROGRESS_SECRET
    if (!secret) throw new Error('Migration secret not configured on server')
    if (args.migrationSecret !== secret) throw new Error('Invalid migration secret')

    const dryRun = args.dryRun ?? true
    const batchSize = args.batchSize ?? 200
    const legacyMode = args.legacyMode ?? 'flattened'

    // Collect all userProgress docs (or filter by courseId if provided)
    let progressDocs = await ctx.db
      .query('userProgress')
      .collect()

    if (args.courseId) {
      progressDocs = progressDocs.filter(p => String(p.courseId) === String(args.courseId))
    }

    let total = progressDocs.length
    let candidates = [] as any[]

    for (const p of progressDocs) {
      const lp = (p as any).lastPlaybackTime
      if (!lp) continue
      // Detect legacy shapes:
      // - flattened: { lessonIndex: number, time }
      // - module_scoped: { moduleIndex: number, lessonIndex: number, time }
      const isFlattened = lp.lessonId === undefined && typeof lp.lessonIndex === 'number' && lp.moduleIndex === undefined
      const isModuleScoped = lp.lessonId === undefined && typeof lp.lessonIndex === 'number' && typeof lp.moduleIndex === 'number'
      if (isFlattened || isModuleScoped) {
        candidates.push(p)
      }
    }

    const results: Array<any> = []
    let migrated = 0

    // Helper to build flattened lessons list for a course
    async function buildFlatLessons(courseId: any) {
      const modules = await ctx.db
        .query('modules')
        .withIndex('by_course', q => q.eq('courseId', courseId))
        .collect()

      const sortedModules = modules.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))

      const flat: any[] = []
      for (const mod of sortedModules) {
        const lessons = await ctx.db
          .query('lessons')
          .withIndex('by_module', q => q.eq('moduleId', mod._id))
          .collect()

        const sortedLessons = lessons.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        for (const lesson of sortedLessons) flat.push(lesson)
      }
      return flat
    }

    // Helper to get lessons for a specific module index
    async function getModuleLessonsByIndex(courseId: any, moduleIndex: number) {
      const modules = await ctx.db
        .query('modules')
        .withIndex('by_course', q => q.eq('courseId', courseId))
        .collect()

      const sortedModules = modules.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      const mod = sortedModules[moduleIndex]
      if (!mod) return []

      const lessons = await ctx.db
        .query('lessons')
        .withIndex('by_module', q => q.eq('moduleId', mod._id))
        .collect()

      return lessons.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    }

    // Process in batches to avoid long-running operations
    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize)

      // For courses present in this batch, pre-build flattened lesson arrays
      const courseToFlat: Record<string, any[]> = {}

      for (const p of batch) {
        const courseId = String(p.courseId)
        if (!courseToFlat[courseId]) {
          courseToFlat[courseId] = await buildFlatLessons(p.courseId)
        }
      }

      for (const p of batch) {
        try {
          const lp = (p as any).lastPlaybackTime
          let lesson = null as any
          const flat = courseToFlat[String(p.courseId)]

          if (legacyMode === 'flattened') {
            const idx = lp.lessonIndex as number
            if (idx < 0 || idx >= flat.length) {
              results.push({ progressId: p._id, ok: false, reason: 'index_out_of_bounds', index: idx, flatLength: flat.length })
              continue
            }

            lesson = flat[idx]
          } else if (legacyMode === 'module_scoped') {
            // Expect { moduleIndex, lessonIndex }
            const midx = lp.moduleIndex as number
            const lidx = lp.lessonIndex as number
            const moduleLessons = await getModuleLessonsByIndex(p.courseId, midx)
            if (lidx < 0 || lidx >= moduleLessons.length) {
              results.push({ progressId: p._id, ok: false, reason: 'module_index_out_of_bounds', moduleIndex: midx, lessonIndex: lidx, moduleLessons: moduleLessons.length })
              continue
            }

            lesson = moduleLessons[lidx]
          }

          if (!lesson) {
            results.push({ progressId: p._id, ok: false, reason: 'lesson_not_found', indexShape: legacyMode, raw: lp })
            continue
          }

          const newLastPlayback = { lessonId: lesson._id, time: lp.time }

          if (!dryRun) {
            await ctx.db.patch(p._id, { lastPlaybackTime: newLastPlayback as any })

            // Insert an audit activity for traceability
            try {
              await ctx.db.insert('user_activities', {
                userId: p.userId ?? null,
                activityType: 'migration_user_progress',
                entityId: String(p._id),
                entityType: 'userProgress',
                createdAt: new Date().toISOString(),
                metadata: {
                  old: lp,
                  new: newLastPlayback,
                  migratedBy: 'migrateUserProgress',
                }
              })
            } catch (auditErr) {
              // Don't fail the whole migration if audit logging fails; record it in results
              results.push({ progressId: p._id, ok: true, warning: 'audit_failed', message: String(auditErr) })
            }
          }

          migrated++
          results.push({ progressId: p._id, ok: true, old: lp, new: newLastPlayback })
        } catch (err: any) {
          results.push({ progressId: p._id, ok: false, reason: 'exception', message: String(err) })
        }
      }
    }

    return {
      totalProgressDocuments: total,
      candidateDocuments: candidates.length,
      migrated: migrated,
      dryRun,
      batchSize,
      details: results.slice(0, 200) // limit returned details to first 200 entries
    }
  }
})
