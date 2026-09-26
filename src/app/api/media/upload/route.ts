import { NextResponse } from "next/server";
import { saveMediaFile } from "@/lib/media-store";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const trackId = form.get("trackId");
    const file = form.get("file");

    if (typeof trackId !== "string" || !(file instanceof File)) {
      return NextResponse.json({ error: "trackId, file은 필수입니다." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const allowed = ["png", "jpg", "jpeg", "webp", "mp4", "mov", "webm"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: `지원하지 않는 확장자입니다: ${ext}` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveMediaFile(trackId, "upload", buffer, ext);

    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
