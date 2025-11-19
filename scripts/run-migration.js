// Simple runner for the `migrateUserProgress` Convex mutation.
// Usage:
//   export MIGRATE_USER_PROGRESS_SECRET=yoursecret
//   export NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:8787
//   node scripts/run-migration.js --dry

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry") || args.includes("--dry-run");
  const legacyModeArgIndex = args.indexOf("--mode");
  const legacyMode =
    legacyModeArgIndex >= 0 ? args[legacyModeArgIndex + 1] : "flattened";

  const secret = process.env.MIGRATE_USER_PROGRESS_SECRET;
  if (!secret) {
    console.error("MIGRATE_USER_PROGRESS_SECRET not set in environment");
    process.exit(2);
  }

  const convexUrl =
    process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!convexUrl) {
    console.error(
      "NEXT_PUBLIC_CONVEX_URL or CONVEX_URL not set in environment"
    );
    process.exit(2);
  }

  try {
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("../convex/_generated/api.js");

    const convex = new ConvexHttpClient(convexUrl, {
      skipConvexDeploymentUrlCheck: true,
    });

    console.log(
      "Calling migrateUserProgress (dryRun=%s, legacyMode=%s)...",
      dry,
      legacyMode
    );
    const res = await convex.mutate(api.migrateUserProgress, {
      migrationSecret: secret,
      dryRun: dry,
      legacyMode: legacyMode,
      batchSize: 200,
    });

    console.log("Migration returned:");
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Migration runner error:", err);
    process.exit(1);
  }
}

main();
