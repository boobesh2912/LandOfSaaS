import { NextResponse } from "next/server";
import { listBuildings } from "@/lib/store";
import { toPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await listBuildings();
    return NextResponse.json(rows.map(toPublic));
  } catch (err) {
    console.error("GET /api/buildings failed", err);
    return NextResponse.json({ error: "Could not load the board" }, { status: 500 });
  }
}
