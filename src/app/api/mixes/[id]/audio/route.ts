import { NextResponse } from "next/server";
import { saveTrackAudio } from "@/lib/media-store";
import { setTrackAudio } from "@/lib/mixes";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const form = await req.formData();
    const trackId = form.get("trackId");
    const file = form.get("file");

    if (typeof trackId !== "string" || !(file instanceof File)) {
      return NextResponse.json({ error: "trackId, file은 필수입니다." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const allowed = ["mp3", "wav", "m4a", "aac", "ogg"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: `지원하지 않는 오디오 확장자입니다: ${ext}` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveTrackAudio(id, trackId, buffer, ext);
    const mix = await setTrackAudio(id, trackId, url);
    if (!mix) return NextResponse.json({ error: "믹스 또는 트랙을 찾을 수 없습니다." }, { status: 404 });

    return NextResponse.json({ mix });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
