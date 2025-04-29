import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get tasks for the current user
export const getUserTasks = query({
  args: {
    userId: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, startDate, endDate } = args;
    
    // Base query to get user's tasks
    let tasksQuery = ctx.db
      .query("tasks")
      .withIndex("by_user_id", (q) => q.eq("userId", userId));
    
    // Apply date range filter if provided
    if (startDate && endDate) {
      tasksQuery = ctx.db
        .query("tasks")
        .withIndex("by_user_date", (q) => 
          q.eq("userId", userId)
           .gte("date", startDate)
           .lte("date", endDate)
        );
    }
    
    // Execute query and return tasks
    const tasks = await tasksQuery.collect();
    return tasks;
  },
});

// Create a new task
export const createTask = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    date: v.string(), // ISO date string
    type: v.union(v.literal("assignment"), v.literal("quiz"), v.literal("project"), v.literal("reminder"), v.literal("other")),
    dueTime: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, title, date, type, dueTime, description } = args;
    
    const taskId = await ctx.db.insert("tasks", {
      userId,
      title,
      date,
      type,
      dueTime,
      description,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return taskId;
  },
});

// Update an existing task
export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    type: v.optional(v.union(v.literal("assignment"), v.literal("quiz"), v.literal("project"), v.literal("reminder"), v.literal("other"))),
    dueTime: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    
    // Get the existing task
    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    // Create a properly typed update object
    const updateData: Partial<Doc<"tasks">> = {
      updatedAt: Date.now()
    };
    
    // Add only the defined updates with proper typing
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.dueTime !== undefined) updateData.dueTime = updates.dueTime;
    if (updates.description !== undefined) updateData.description = updates.description;
    
    // Update the task with new values
    await ctx.db.patch(taskId, updateData);
    
    return taskId;
  },
});

// Toggle task completion status
export const toggleTaskCompletion = mutation({
  args: {
    taskId: v.id("tasks"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { taskId, completed } = args;
    
    // Get the existing task
    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    // Update the task completion status
    await ctx.db.patch(taskId, {
      completed,
      updatedAt: Date.now(),
    });
    
    return taskId;
  },
});

// Delete a task
export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const { taskId } = args;
    
    // Get the existing task
    const task = await ctx.db.get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }
    
    // Delete the task
    await ctx.db.delete(taskId);
    
    return true;
  },
});