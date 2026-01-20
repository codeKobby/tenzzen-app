import { NextResponse } from "next/server";

/**
 * Health Check Endpoint
 *
 * Returns the status of critical services.
 * Used for monitoring and load balancer health checks.
 */

interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  error?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    ai: ServiceHealth;
    auth: ServiceHealth;
    youtube: ServiceHealth;
  };
  uptime: number;
}

const startTime = Date.now();

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const services: HealthResponse["services"] = {
    database: { status: "healthy" },
    ai: { status: "healthy" },
    auth: { status: "healthy" },
    youtube: { status: "healthy" },
  };

  // Check Convex connectivity
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    services.database = {
      status: "unhealthy",
      error: "CONVEX_URL not configured",
    };
  } else {
    const dbStart = Date.now();
    try {
      const response = await fetch(
        `${convexUrl}/.well-known/openid-configuration`,
        {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        },
      );
      services.database = {
        status: response.ok ? "healthy" : "degraded",
        latency: Date.now() - dbStart,
      };
    } catch (error) {
      services.database = {
        status: "degraded",
        latency: Date.now() - dbStart,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  // Check AI service configuration
  services.ai =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?
      { status: "healthy" }
    : { status: "unhealthy", error: "API key not configured" };

  // Check Auth (Clerk) configuration
  services.auth =
    (
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY
    ) ?
      { status: "healthy" }
    : { status: "unhealthy", error: "Clerk not configured" };

  // Check YouTube API configuration
  services.youtube =
    process.env.YOUTUBE_API_KEY ?
      { status: "healthy" }
    : { status: "degraded", error: "YouTube API key not configured" };

  // Determine overall status
  const statuses = Object.values(services).map((s) => s.status);
  let overallStatus: HealthResponse["status"] = "healthy";
  if (statuses.includes("unhealthy")) {
    overallStatus = "unhealthy";
  } else if (statuses.includes("degraded")) {
    overallStatus = "degraded";
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
    environment: process.env.NODE_ENV || "development",
    services,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  return NextResponse.json(response, {
    status: overallStatus === "unhealthy" ? 503 : 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
