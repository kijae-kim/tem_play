import { NextResponse } from "next/server";
import { listTrackMedia } from "@/lib/media-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId } = await params;
  const media = await listTrackMedia(trackId);
  return NextResponse.json(media);
}
