import { NextResponse } from "next/server";
import { isYoutubeConnected } from "@/lib/youtube";

export async function GET() {
  return NextResponse.json({ connected: await isYoutubeConnected() });
}
