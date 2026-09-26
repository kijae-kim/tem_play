import { NextResponse } from "next/server";
import { fetchRecentlyPlayed } from "@/lib/spotify";

export async function GET() {
  try {
    const tracks = await fetchRecentlyPlayed();
    return NextResponse.json({ tracks });
  } catch (e: any) {
    if (e.message === "NOT_AUTHENTICATED") {
      return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
