import { NextResponse } from "next/server";
import { buildVideoPrompt, generateTrackVideo, isSeedanceEnabled } from "@/lib/seedance";
import { saveMediaFile } from "@/lib/media-store";

export async function POST(req: Request) {
  if (!isSeedanceEnabled()) {
    return NextResponse.json(
      { error: "SEEDANCE_API_KEY가 설정되지 않아 영상 생성을 쓸 수 없습니다." },
      { status: 400 }
    );
  }

  try {
    const { trackId, trackName, artists, moodNote, durationSeconds } = await req.json();
    if (!trackId || !trackName) {
      return NextResponse.json({ error: "trackId, trackName은 필수입니다." }, { status: 400 });
    }

    const prompt = buildVideoPrompt(trackName, artists ?? "", moodNote);
    const buffer = await generateTrackVideo(prompt, durationSeconds ?? 5);
    const url = await saveMediaFile(trackId, "video", buffer, "mp4");

    return NextResponse.json({ url, prompt });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
