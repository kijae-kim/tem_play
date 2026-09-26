import { NextResponse } from "next/server";
import path from "path";
import os from "os";
import { promises as fs } from "fs";
import { getMix } from "@/lib/mixes";
import {
  listFinalVideos,
  listTrackMedia,
  nextFinalVideoPath,
  publicUrlToPath,
} from "@/lib/media-store";
import { concatAudio, renderFinalVideo } from "@/lib/ffmpeg";

const VIDEO_EXT = /\.(mp4|mov|webm)$/i;
const IMAGE_EXT = /\.(png|jpg|jpeg|webp)$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const videos = await listFinalVideos(id);
  return NextResponse.json({ videos });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const mix = await getMix(id);
  if (!mix) return NextResponse.json({ error: "믹스를 찾을 수 없습니다." }, { status: 404 });

  const tracksWithAudio = mix.tracks.filter((t) => t.audioUrl);
  if (tracksWithAudio.length === 0) {
    return NextResponse.json(
      { error: "오디오가 첨부된 곡이 없습니다. 먼저 각 곡에 로열티프리 음원을 붙여주세요." },
      { status: 400 }
    );
  }

  const media = await listTrackMedia(id);
  const videoCandidates = [
    ...media.videos,
    ...media.uploads.filter((u) => VIDEO_EXT.test(u)),
  ];
  const imageCandidates = [
    ...media.images,
    ...media.uploads.filter((u) => IMAGE_EXT.test(u)),
  ];
  const backgroundUrl = videoCandidates.at(-1) ?? imageCandidates.at(-1);
  if (!backgroundUrl) {
    return NextResponse.json(
      { error: "먼저 이 믹스의 비주얼(이미지/영상)을 하나 이상 생성하거나 업로드해주세요." },
      { status: 400 }
    );
  }
  const isVideoBackground = VIDEO_EXT.test(backgroundUrl);

  const concatPath = path.join(os.tmpdir(), `mkplaylist-${id}-${Date.now()}.m4a`);
  try {
    await concatAudio(
      tracksWithAudio.map((t) => publicUrlToPath(t.audioUrl!)),
      concatPath
    );

    const { absPath, url } = await nextFinalVideoPath(id);
    await renderFinalVideo({
      backgroundImagePath: isVideoBackground ? undefined : publicUrlToPath(backgroundUrl),
      backgroundVideoPath: isVideoBackground ? publicUrlToPath(backgroundUrl) : undefined,
      audioPath: concatPath,
      outPath: absPath,
    });

    return NextResponse.json({
      url,
      usedTracks: tracksWithAudio.length,
      skippedTracks: mix.tracks.length - tracksWithAudio.length,
      background: backgroundUrl,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    await fs.unlink(concatPath).catch(() => {});
  }
}
