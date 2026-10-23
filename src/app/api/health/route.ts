import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SERVICE_NAME = "marco";

/**
 * Lightweight uptime probe for external monitors.
 * Must not touch the database or any other external service.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    {
      status: "ok",
      service: SERVICE_NAME,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
