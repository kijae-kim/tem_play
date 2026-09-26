import { promises as fs } from "fs";
import path from "path";

const MEDIA_ROOT = path.join(process.cwd(), "public", "generated");

function safeTrackDir(trackId: string): string {
  // 트랙 ID를 그대로 폴더명에 써도 되도록 영숫자만 남긴다 (경로 조작 방지)
  const safe = trackId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) throw new Error("INVALID_TRACK_ID");
  return path.join(MEDIA_ROOT, safe);
}

export async function saveMediaFile(
  trackId: string,
  kind: "image" | "video" | "upload",
  buffer: Buffer,
  ext: string
): Promise<string> {
  const dir = safeTrackDir(trackId);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${kind}-${Date.now()}.${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);
  const safe = path.basename(dir);
  return `/generated/${safe}/${filename}`;
}

export interface TrackMedia {
  images: string[];
  videos: string[];
  uploads: string[];
}

export async function listTrackMedia(trackId: string): Promise<TrackMedia> {
  const dir = safeTrackDir(trackId);
  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch {
    return { images: [], videos: [], uploads: [] };
  }
  const safe = path.basename(dir);
  const toUrl = (f: string) => `/generated/${safe}/${f}`;
  return {
    images: files.filter((f) => f.startsWith("image-")).map(toUrl).sort(),
    videos: files.filter((f) => f.startsWith("video-")).map(toUrl).sort(),
    uploads: files.filter((f) => f.startsWith("upload-")).map(toUrl).sort(),
  };
}
