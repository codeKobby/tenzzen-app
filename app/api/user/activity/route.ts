import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { config } from "@/lib/config";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    const token = await getToken({ template: "convex" });
    const convex = new ConvexHttpClient(config.convex.url);
    if (token) convex.setAuth(token);

    const today = new Date().toISOString().split("T")[0];

    const minutes = await convex.query(api.activity.getTodayActiveMinutes, {
      userId,
      date: today,
    });

    return NextResponse.json({
      success: true,
      activity: minutes != null ? { date: today, minutes } : null,
    });
  } catch (error) {
    console.error("[user/activity] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    const body = await req.json();
    const { minutes, date } = body || {};
    if (typeof minutes !== "number" || !date) {
      return NextResponse.json(
        { success: false, error: "Missing minutes or date" },
        { status: 400 }
      );
    }

    const token = await getToken({ template: "convex" });
    const convex = new ConvexHttpClient(config.convex.url);
    if (token) convex.setAuth(token);

    await convex.mutation(api.activity.upsertActiveMinutes, {
      userId,
      date,
      minutes,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[user/activity] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
