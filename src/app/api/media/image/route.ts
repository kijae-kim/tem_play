import { NextResponse } from "next/server";
import { buildImagePrompt, generateTrackImage } from "@/lib/gemini";
import { saveMediaFile } from "@/lib/media-store";

export async function POST(req: Request) {
  try {
    const { mixId, mixName, tracks, moodNote } = await req.json();
    if (!mixId || !mixName) {
      return NextResponse.json({ error: "mixId, mixName은 필수입니다." }, { status: 400 });
    }

    const prompt = buildImagePrompt(mixName, tracks ?? [], moodNote);
    const buffer = await generateTrackImage(prompt);
    const url = await saveMediaFile(mixId, "image", buffer, "png");

    return NextResponse.json({ url, prompt });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
