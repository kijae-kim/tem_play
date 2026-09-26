import { NextResponse } from "next/server";
import { fetchMyPlaylists } from "@/lib/spotify";

export async function GET() {
  try {
    const playlists = await fetchMyPlaylists();
    return NextResponse.json({ playlists });
  } catch (e: any) {
    if (e.message === "NOT_AUTHENTICATED") {
      return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
