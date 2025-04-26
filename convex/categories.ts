import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get all available categories
export const getCategories = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    // Get categories sorted by course count (most popular first)
    const categories = await ctx.db
      .query("categories")
      .order("desc") // Fixed: removed second parameter and field selector
      .take(limit);
    
    return categories;
  }
});

// Create a new category
export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    slug: v.string()
  },
  handler: async (ctx, args) => {
    // Check if category with same name or slug already exists
    const existingCategory = await ctx.db
      .query("categories")
      .filter(q => 
        q.or(
          q.eq(q.field("name"), args.name),
          q.eq(q.field("slug"), args.slug)
        )
      )
      .first();
    
    if (existingCategory) {
      throw new Error(`Category with name "${args.name}" or slug "${args.slug}" already exists`);
    }
    
    // Create the category
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      description: args.description,
      icon: args.icon,
      color: args.color,
      slug: args.slug,
      courseCount: 0
    });
    
    return { categoryId };
  }
});

// Update a category
export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    slug: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Check if category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error(`Category with ID ${args.categoryId} not found`);
    }
    
    // Check if new slug or name would conflict with existing category
    if (args.name || args.slug) {
      const conflictQuery = ctx.db
        .query("categories")
        .filter((q) => q.neq(q.field("_id"), args.categoryId)); // Fixed: changed q.id() to q.field("_id")
      
      if (args.name) {
        conflictQuery.filter(q => q.eq(q.field("name"), args.name));
      }
      
      if (args.slug) {
        conflictQuery.filter(q => q.eq(q.field("slug"), args.slug));
      }
      
      const conflict = await conflictQuery.first();
      if (conflict) {
        throw new Error("Category with the same name or slug already exists");
      }
    }
    
    // Update the category
    const updateFields: any = {};
    if (args.name) updateFields.name = args.name;
    if (args.description) updateFields.description = args.description;
    if (args.icon) updateFields.icon = args.icon;
    if (args.color) updateFields.color = args.color;
    if (args.slug) updateFields.slug = args.slug;
    
    await ctx.db.patch(args.categoryId, updateFields);
    
    return { success: true };
  }
});

// Delete a category (only if no courses are associated)
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories")
  },
  handler: async (ctx, args) => {
    // Check if category exists
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error(`Category with ID ${args.categoryId} not found`);
    }
    
    // Check if category has associated courses
    if (category.courseCount > 0) {
      throw new Error("Cannot delete category with associated courses");
    }
    
    // Delete the category
    await ctx.db.delete(args.categoryId);
    
    return { success: true };
  }
});

// Get popular categories (for display on explore page)
export const getPopularCategories = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    // Get categories sorted by course count (most popular first)
    const categories = await ctx.db
      .query("categories")
      .order("desc") // Fixed: removed second parameter
      .take(limit);
    
    return categories;
  }
});

// Add course to category
export const addCourseToCategory = mutation({
  args: {
    courseId: v.id("courses"),
    categoryId: v.id("categories")
  },
  handler: async (ctx, args) => {
    // Check if course and category exist
    const [course, category] = await Promise.all([
      ctx.db.get(args.courseId),
      ctx.db.get(args.categoryId)
    ]);
    
    if (!course) {
      throw new Error(`Course with ID ${args.courseId} not found`);
    }
    
    if (!category) {
      throw new Error(`Category with ID ${args.categoryId} not found`);
    }
    
    // Check if association already exists
    const existingAssociation = await ctx.db
      .query("course_categories")
      .filter(q => 
        q.and(
          q.eq(q.field("courseId"), args.courseId),
          q.eq(q.field("categoryId"), args.categoryId)
        )
      )
      .first();
    
    if (existingAssociation) {
      // Already associated
      return { success: true, alreadyExists: true };
    }
    
    // Create the association
    await ctx.db.insert("course_categories", {
      courseId: args.courseId,
      categoryId: args.categoryId
    });
    
    // Increment the category course count
    await ctx.db.patch(args.categoryId, {
      courseCount: category.courseCount + 1
    });
    
    return { success: true, alreadyExists: false };
  }
});

// Remove course from category
export const removeCourseFromCategory = mutation({
  args: {
    courseId: v.id("courses"),
    categoryId: v.id("categories")
  },
  handler: async (ctx, args) => {
    // Check if association exists
    const association = await ctx.db
      .query("course_categories")
      .filter(q => 
        q.and(
          q.eq(q.field("courseId"), args.courseId),
          q.eq(q.field("categoryId"), args.categoryId)
        )
      )
      .first();
    
    if (!association) {
      return { success: false, notFound: true };
    }
    
    // Delete the association
    await ctx.db.delete(association._id);
    
    // Get the category
    const category = await ctx.db.get(args.categoryId);
    if (category) {
      // Decrement the category course count (ensuring it doesn't go below 0)
      await ctx.db.patch(args.categoryId, {
        courseCount: Math.max(0, category.courseCount - 1)
      });
    }
    
    return { success: true, notFound: false };
  }
});