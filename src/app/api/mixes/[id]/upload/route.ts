import { NextResponse } from "next/server";
import { publicUrlToPath } from "@/lib/media-store";
import { uploadVideo } from "@/lib/youtube";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // 라우트 일관성을 위해 받지만 업로드 자체엔 mixId가 필요 없음 (videoUrl로 충분)
  try {
    const { videoUrl, title, description, tags } = await req.json();
    if (!videoUrl || !title) {
      return NextResponse.json({ error: "videoUrl, title은 필수입니다." }, { status: 400 });
    }

    const result = await uploadVideo({
      filePath: publicUrlToPath(videoUrl),
      title,
      description: description ?? "",
      tags: Array.isArray(tags) ? tags : undefined,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    if (e.message === "NOT_AUTHENTICATED") {
      return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
