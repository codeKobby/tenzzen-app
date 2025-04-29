# Database Migration Guide

This document explains how to use the migration system for making database schema changes in the Tenzzen application.

## Migration System Overview

The Tenzzen application uses a custom migration system built on top of Convex to manage database schema changes. This system provides:

1. Version tracking for schema changes
2. Ordered migration execution
3. Dependency management between migrations
4. Transaction safety for data transformations
5. Logging and history of applied migrations

## Key Components

The migration system consists of the following components:

1. **`migration-framework.ts`** - Core functions for registering and tracking migrations
2. **`migrations.ts`** - Definitions of specific migrations and their implementations
3. **`migration-utils.ts`** - Utility functions for running migrations
4. **`migrations_registry`** table - Database table that tracks applied migrations

## Creating a New Migration

To create a new migration, follow these steps:

### 1. Define the Migration Metadata

Add a new migration object to the `migrations` array in `migrations.ts`:

```typescript
{
  id: "unique-migration-id",
  name: "Human Readable Migration Name",
  description: "Detailed description of what this migration does",
  version: 5, // Increment from the previous highest version
  runAfter: ["previous-migration-id"], // Optional dependencies
  apply: async (ctx) => {
    // Migration implementation goes here
    return await ctx.runMutation("migrations:yourMigrationFunction", {});
  }
}
```

### 2. Implement the Migration Logic

Create a new mutation function in `migrations.ts` to implement the actual data transformation:

```typescript
export const yourMigrationFunction = mutation({
  args: {},
  handler: async (ctx) => {
    // Your migration implementation
    // - Query data that needs to be transformed
    // - Apply changes to the data
    // - Return a result object

    return {
      success: true,
      message: "Migration completed successfully",
      // Additional result data
    };
  },
});
```

### 3. Schema Changes

If your migration involves schema changes (new tables, fields, or indexes):

1. Update the `schema.ts` file with the necessary changes
2. Document the schema change in your migration metadata
3. Deploy the schema changes along with your migration code

Note that Convex handles schema changes automatically, but it's important to track them as migrations for documentation and dependency tracking.

## Running Migrations

There are two ways to run migrations:

### Run All Pending Migrations

To run all pending migrations that haven't been applied yet:

```typescript
// From a Convex action or mutation
await ctx.runAction("migration-utils:runPendingMigrations", {});

// From the Convex CLI
npx convex run migration-utils:runPendingMigrations
```

### Run a Specific Migration

To run a specific migration by ID:

```typescript
// From a Convex action or mutation
await ctx.runAction("migration-utils:runSpecificMigration", {
  migrationId: "your-migration-id"
});

// From the Convex CLI
npx convex run migration-utils:runSpecificMigration --args='{ "migrationId": "your-migration-id" }'
```

## Migration Best Practices

Follow these guidelines when creating migrations:

1. **Make migrations idempotent** - They should be safely rerunnable
2. **Include validation** - Check data integrity before and after changes
3. **Use transactions** - Ensure data consistency during updates
4. **Add meaningful logging** - Help with debugging if issues occur
5. **Keep migrations focused** - Each migration should do one logical change
6. **Test thoroughly** - Test migrations on development data before production
7. **Document schema impacts** - Note all tables and fields affected

## Handling Migration Failures

If a migration fails:

1. Review the error message and logs
2. Fix the issue in the migration code
3. Deploy the updated code
4. Re-run the specific migration that failed

The system is designed to skip migrations that have already been successfully applied, so you only need to fix and rerun the failed migration.

## Schema Versioning

The migration system automatically tracks the current schema version based on the highest version number of applied migrations. You can query the current schema version with:

```typescript
// From a Convex query or mutation
const version = await ctx.runQuery(
  "migration-framework:getCurrentSchemaVersion",
  {}
);
```

## Example Migration Scenarios

### Adding a New Field

```typescript
{
  id: "add-course-level-field",
  name: "Add Course Level Field",
  description: "Add a level field to courses for filtering by difficulty",
  version: 5,
  apply: async (ctx) => {
    // Schema change is handled by updating schema.ts
    // No data migration needed for new fields
    return {
      success: true,
      message: "Schema updated with new course level field",
      schemaChange: true
    };
  }
}
```

### Data Transformation

```typescript
export const updateUserRoles = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all users with the old role
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "teacher"))
      .collect();

    let updated = 0;

    // Update each user to the new role
    for (const user of users) {
      await ctx.db.patch(user._id, {
        role: "instructor",
      });
      updated++;
    }

    return {
      success: true,
      message: `Updated ${updated} users from 'teacher' to 'instructor' role`,
      usersUpdated: updated,
    };
  },
});
```

## Additional Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Schema Documentation](./database/schema-documentation.md)
- [Validation Rules](../convex/validation.ts)
