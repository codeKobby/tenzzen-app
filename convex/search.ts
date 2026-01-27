// ... existing code ...
import { v } from "convex/values";
import { query } from "./_generated/server";

export const globalSearch = query({
  args: {
    query: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.query) {
      return { courses: [], notes: [], materials: [] };
    }

    const [courses, notes, materials] = await Promise.all([
      ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.query).eq("isPublic", true),
        )
        .take(5),
      ctx.db
        .query("notes")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.query).eq("clerkId", args.userId),
        )
        .take(5),
      ctx.db
        .query("user_materials")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.query).eq("userId", args.userId),
        )
        .take(5),
    ]);

    return {
      courses: courses.map((c) => ({
        id: c._id,
        type: "course",
        title: c.title,
        description: c.description,
        url: `/courses/${c._id}`,
      })),
      notes: notes.map((n) => ({
        id: n._id,
        type: "note",
        title: n.title,
        description: n.content.substring(0, 100), // refined in UI
        url: `/library?note=${n._id}`,
      })),
      materials: materials.map((m) => ({
        id: m._id,
        type: "material",
        title: m.title,
        description: m.summary || "No summary available",
        url: `/library?material=${m._id}`, // simplified URL scheme
      })),
    };
  },
});
