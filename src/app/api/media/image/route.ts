import { NextResponse } from "next/server";
import { buildImagePrompt, generateTrackImage } from "@/lib/gemini";
import { saveMediaFile } from "@/lib/media-store";

export async function POST(req: Request) {
  try {
    const { trackId, trackName, artists, moodNote } = await req.json();
    if (!trackId || !trackName) {
      return NextResponse.json({ error: "trackId, trackName은 필수입니다." }, { status: 400 });
    }

    const prompt = buildImagePrompt(trackName, artists ?? "", moodNote);
    const buffer = await generateTrackImage(prompt);
    const url = await saveMediaFile(trackId, "image", buffer, "png");

    return NextResponse.json({ url, prompt });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
