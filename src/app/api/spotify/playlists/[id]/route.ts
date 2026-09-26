import { NextResponse } from "next/server";
import { fetchPlaylistTracks } from "@/lib/spotify";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const tracks = await fetchPlaylistTracks(id);
    return NextResponse.json({ tracks });
  } catch (e: any) {
    if (e.message === "NOT_AUTHENTICATED") {
      return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
