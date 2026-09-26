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

// 믹스에 담긴 곡 하나에 붙일 로열티프리 대체 음원을 저장한다. 곡당 1개만 유지하고,
// 다시 업로드하면 이전 파일(확장자가 달라도)을 지우고 교체한다.
export async function saveTrackAudio(
  mixId: string,
  trackId: string,
  buffer: Buffer,
  ext: string
): Promise<string> {
  const safeMix = path.basename(safeTrackDir(mixId));
  const safeTrack = trackId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeTrack) throw new Error("INVALID_TRACK_ID");

  const dir = path.join(MEDIA_ROOT, safeMix, "audio");
  await fs.mkdir(dir, { recursive: true });

  const existing = await fs.readdir(dir).catch(() => [] as string[]);
  await Promise.all(
    existing
      .filter((f) => f.startsWith(`${safeTrack}.`))
      .map((f) => fs.unlink(path.join(dir, f)))
  );

  const filename = `${safeTrack}.${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/generated/${safeMix}/audio/${filename}`;
}

export function publicUrlToPath(url: string): string {
  return path.join(process.cwd(), "public", url.replace(/^\//, ""));
}

export async function nextFinalVideoPath(
  mixId: string
): Promise<{ absPath: string; url: string }> {
  const safeMix = path.basename(safeTrackDir(mixId));
  const dir = path.join(MEDIA_ROOT, safeMix, "final");
  await fs.mkdir(dir, { recursive: true });
  const filename = `mix-${Date.now()}.mp4`;
  return {
    absPath: path.join(dir, filename),
    url: `/generated/${safeMix}/final/${filename}`,
  };
}

export async function listFinalVideos(mixId: string): Promise<string[]> {
  const safeMix = path.basename(safeTrackDir(mixId));
  const dir = path.join(MEDIA_ROOT, safeMix, "final");
  try {
    const files = await fs.readdir(dir);
    return files.map((f) => `/generated/${safeMix}/final/${f}`).sort();
  } catch {
    return [];
  }
}
