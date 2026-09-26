import { NextResponse } from "next/server";
import { listTrackMedia } from "@/lib/media-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mixId: string }> }
) {
  const { mixId } = await params;
  const media = await listTrackMedia(mixId);
  return NextResponse.json(media);
}
