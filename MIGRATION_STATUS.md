# Database Migration Status: Supabase → Convex

## ✅ Migration Decision

**Primary Database: Convex**

- Core AI features (course generation, quizzes) use Convex
- Convex schema is complete and active
- Convex dev server is running
- Documentation confirms Convex as the backend

## ✅ Completed Cleanup

### Removed Files & Folders

- `lib/supabase*` - All Supabase client libraries
- `lib/user-sync.ts` - User sync to Supabase
- `contexts/supabase-context.tsx` - Supabase React context
- `hooks/use-supabase*.ts` - All Supabase hooks
- `components/supabase-test.tsx` - Test components
- `components/dashboard-supabase-test.tsx`
- `components/providers/database-provider.tsx`
- `app/api/supabase/**` - All Supabase API routes
- `app/test-supabase` - Test pages
- `app/debug/supabase-check` - Debug pages
- `app/api-test` - API test pages
- `app/admin` - Admin pages (were Supabase-dependent)
- **`app/api/user/activity`** - User activity tracking API
- **`app/api/users/sync`** - User sync API
- **`app/api/users/update-streak`** - Streak update API
- **`app/api/categories/refresh`** - Category refresh API
- **`app/api/notes`** - Notes API routes
- **`app/api/debug/supabase-connection`** - Supabase connection debug
- **`app/api/debug/user-sync`** - User sync debug
- **`app/api/debug/env-check`** - Environment check (Supabase)
- **`app/api/debug/jwt-template-check`** - JWT template check (Supabase)
- **`app/api/clerk/check-jwt`** - JWT check (Supabase)

### Updated Files

- `middleware.ts` - Removed Supabase imports
- `hooks/use-supabase-dashboard.ts` - **✅ MIGRATED to Convex queries**
- `hooks/use-streak.ts` - **✅ MIGRATED to Convex mutations**
- `hooks/use-normalized-course.ts` - Removed unused useSupabase call
- `hooks/use-categories.ts` - Removed unused useSupabase call
- `hooks/use-assessment.ts` - **Stubbed useSectionAssessments function, removed useSupabase**
- `app/courses/page.tsx` - Removed useSupabase import and usage
- `app/courses/hooks/use-user-courses.ts` - Removed Supabase import
- `app/courses/hooks/use-category-user-courses.ts` - **✅ MIGRATED to Convex queries**
- `app/explore/hooks/use-courses.ts` - Removed useSupabase call
- `app/explore/hooks/use-category-courses.ts` - Removed useSupabase call
- `app/explore/[courseId]/page.tsx` - Removed useSupabase import
- `components/user-initializer.tsx` - Removed useSupabase import and dependency
- `components/course-panel.tsx` - Removed useSupabase call
- `components/course/course-panel-context.tsx` - Removed useSupabase call
- `components/analysis/course-panel-context.tsx` - Removed useSupabase call
- `components/analysis/course/course-panel-context.tsx` - Removed useSupabase call
- `components/analysis/header.tsx` - **Fixed syntax errors (undefined scrolled variable, JSX structure)**
- `components/analysis/video-content.tsx` - **Fixed malformed code (imports inside function body, duplicate definitions)**
- `app/analysis/[video-id]/page.tsx` - **Removed duplicate export default**
- **`app/api/webhooks/clerk/route.ts`** - Removed Supabase sync logic, stubbed handlers

### Stubbed Hooks with Implementation Guides

All stubbed hooks now include detailed TODO comments with:

- Required Convex schema definitions
- Query/mutation function signatures
- Implementation steps and logic
- Example code for migration

**Files with Implementation Guides:**

- `hooks/use-supabase-dashboard.ts` - Dashboard stats and activities
- `hooks/use-streak.ts` - User login streak tracking
- `app/courses/hooks/use-category-user-courses.ts` - Course enrollment system

## ⚠️ TODO: Features to Migrate to Convex

### 1. User Courses Management

**Files**: `app/courses/hooks/use-user-courses.ts`, `app/courses/page.tsx`

- Fetch user's enrolled courses
- Course progress tracking
- Course filtering and search

**Convex Schema Needed**:

```typescript
// Already exists in convex/schema.ts:
courses: defineTable({...})
  .index('by_user', ['createdBy'])
```

### 2. Course Discovery/Explore

**Files**: `app/explore/hooks/use-courses.ts`, `app/explore/[courseId]/page.tsx`

- Public course listing
- Category filtering
- Course enrollment

**Convex Implementation**:

- Add `enrollments` table
- Add queries for public courses
- Add enrollment mutations

### 3. Dashboard Stats

**Files**: `hooks/use-supabase-dashboard.ts`, `app/dashboard/page.tsx`

- User learning statistics
- Recent courses
- Learning activities
- Trends analysis

**Convex Implementation**:

- Add `user_activities` table
- Add aggregation queries
- Add stats computation

### 4. User Streak Tracking

**Files**: `hooks/use-streak.ts` (**STUBBED**)

- Daily login streaks
- Longest streak tracking
- Auto-update on login

**Convex Schema Needed**:

```typescript
user_streaks: defineTable({
  userId: v.string(), // Clerk ID
  streakDays: v.number(),
  longestStreak: v.number(),
  lastCheckIn: v.string(), // ISO date
  weeklyActivity: v.array(v.number()), // 7 numbers for weekly activity
}).index("by_user", ["userId"]);
```

**Convex Queries/Mutations**:

- `getStreak(userId: string)` - Fetch streak data
- `updateStreak(userId: string)` - Check-in and update streak (calculate if broken)

**Current State**: Returns `{ current: 0, longest: 0, loading: false, error: null, updateStreak: async () => {} }`

- Longest streak records

**Convex Implementation**:

- Add `user_streaks` table
- Add daily check-in mutations

### 5. Course Progress

**Files**: `hooks/use-course-progress-update.ts`

- Lesson completion tracking
- Module progress
- Overall course progress

**Convex Implementation**:

- Add `lesson_progress` table
- Add progress update mutations

### 6. Categories

**Files**: `hooks/use-categories.ts`

- Course categories
- Category-based filtering

**Convex Implementation**:

- Add `categories` table or use enum in courses

### 7. Assessments

**Files**: `hooks/use-assessment.ts`, `hooks/use-assessment-provider.tsx`

- Quiz/assessment results
- Score tracking

**Convex Schema**: Already exists (`quizzes` table)

- Just need to add result tracking queries

## 🎯 Current Status

- ✅ App compiles without critical errors
- ✅ Core AI features (course generation) fully functional with Convex
- ✅ All `@/contexts/supabase-context` imports removed (9 files)
- ✅ All `useSupabase()` calls removed or stubbed (11 instances)
- ✅ Fixed syntax errors: analysis header, video-content (imports inside function removed)
- ✅ Fixed duplicate exports in analysis page
- ✅ **Dashboard hooks migrated to Convex (real-time data)**
- ✅ **Streak tracking migrated to Convex (real-time updates)**
- ✅ **Course enrollment hooks migrated to Convex**
- ✅ **Convex schema extended with 5 new tables**
- ✅ **4 new Convex function modules created**
- ⚠️ Course progress tracking needs lesson_progress implementation
- ⚠️ Assessment results need quiz result tracking
- ⚠️ Category filtering needs full implementation

## 📊 Migration Statistics

**Total Files Modified**: 30+

- **Deleted**: 12 API routes, 8+ library files, 4+ test/debug pages
- **Migrated to Convex**: 3 hooks (use-streak, use-supabase-dashboard, use-category-user-courses)
- **Stubbed**: 2 hooks (use-assessment)
- **Syntax Fixes**: 3 files (header.tsx, video-content.tsx, page.tsx)
- **Import Cleanup**: 20+ files had Supabase imports removed
- **Schema Updates**: Added 5 new tables (categories, user_enrollments, user_streaks, lesson_progress, user_activities)
- **Convex Functions**: Created 4 new modules (categories.ts, enrollments.ts, streaks.ts, dashboard.ts)

## 📝 Next Steps

1. **✅ COMPLETED: Convex Schema Extensions**
   - ✅ Added `categories` table to `convex/schema.ts`
   - ✅ Added `user_enrollments` table to `convex/schema.ts`
   - ✅ Added `user_streaks` table to `convex/schema.ts`
   - ✅ Added `lesson_progress` table to `convex/schema.ts`
   - ✅ Added `user_activities` table to `convex/schema.ts`
   - ✅ Added proper indexes for efficient querying

2. **✅ COMPLETED: Dashboard Queries**
   - ✅ Created `convex/dashboard.ts` with getUserStats, getRecentCourses, getLearningActivity
   - ✅ Updated `hooks/use-supabase-dashboard.ts` to use Convex queries with real-time updates

3. **✅ COMPLETED: Enrollment System**
   - ✅ Created `convex/enrollments.ts` with getUserEnrollments, enrollInCourse, updateEnrollmentProgress
   - ✅ Updated `app/courses/hooks/use-category-user-courses.ts` to use Convex queries
   - ✅ Course pages now use Convex enrollment data with real-time updates

4. **✅ COMPLETED: Streak Tracking**
   - ✅ Created `convex/streaks.ts` with getStreak, checkInStreak mutations
   - ✅ Updated `hooks/use-streak.ts` to use Convex with real-time streak updates

5. **Testing & Validation** (Priority: High)
   - Test all CRUD operations for enrollments
   - Verify real-time updates work correctly
   - Ensure Clerk authentication integrates properly

6. **Remaining Tasks**
   - Implement lesson progress tracking with `lesson_progress` table
   - Add quiz result tracking to existing `quizzes` table
   - Implement full category filtering in course discovery
   - Add user activity logging for better analytics

## 🔍 Quick Reference for Developers

### How to Migrate a Stubbed Feature

1. **Check the stub file** for detailed TODO comments (e.g., `hooks/use-streak.ts`)
2. **Create Convex schema** in `convex/schema.ts` as specified in TODO
3. **Create Convex functions** in new file (e.g., `convex/streaks.ts`)
4. **Replace stub logic** with Convex hooks:

   ```typescript
   // Before (stub)
   const [data, setData] = useState(null);

   // After (Convex)
   import { useQuery } from "convex/react";
   import { api } from "@/convex/_generated/api";
   const data = useQuery(api.module.functionName, { params });
   ```

5. **Test thoroughly** with real user data

### Key Convex Patterns

**Reading Data:**

```typescript
const data = useQuery(api.module.queryName, { userId: user?.id });
```

**Writing Data:**

```typescript
const mutate = useMutation(api.module.mutationName);
await mutate({ userId: user?.id, ...params });
```

**Real-time Updates:** Convex queries automatically re-run when data changes!

### Files to Check for Examples

- ✅ `convex/courses.ts` - Working example of Convex queries/mutations
- ✅ `convex/quizzes.ts` - Another working example
- ✅ `actions/generateCourseFromYoutube.ts` - Server action using Convex

5. Add user activity tracking with Convex

## 🚀 Benefits of Migration

- **Simpler Architecture**: Single database instead of dual setup
- **Real-time Updates**: Convex provides real-time subscriptions
- **Type Safety**: Generated TypeScript types
- **Better Performance**: Convex optimized for reads
- **Easier Development**: No need to manage two database connections
