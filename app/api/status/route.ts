import { sql } from "drizzle-orm";

import { db } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = performance.now();
  let dbOnline = false;
  let dbLatencyMs = 0;

  const dbStart = performance.now();
  try {
    await db.execute(sql`select 1`);
    dbOnline = true;
    dbLatencyMs = Math.round(performance.now() - dbStart);
  } catch {
    dbOnline = false;
    dbLatencyMs = Math.round(performance.now() - dbStart);
  }

  const apiLatencyMs = Math.round(performance.now() - start);

  return Response.json(
    {
      status: dbOnline ? "ok" : "degraded",
      api: { online: true, latencyMs: apiLatencyMs },
      db: { online: dbOnline, latencyMs: dbLatencyMs },
    },
    { status: dbOnline ? 200 : 503 }
  );
}
