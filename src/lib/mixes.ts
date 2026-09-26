import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";

const MIXES_DIR = path.join(process.cwd(), "data", "mixes");

export interface MixTrack {
  id: string;
  name: string;
  artists: string;
  albumImageUrl: string | null;
  durationMs: number;
  // 스포티파이 음원은 못 가져오므로, 실제 영상 합성에 쓸 로열티프리 대체 음원을
  // 사용자가 직접 업로드하면 여기 경로가 채워진다.
  audioUrl?: string;
}

export interface Mix {
  id: string;
  name: string;
  createdAt: number;
  tracks: MixTrack[];
}

async function ensureDir() {
  await fs.mkdir(MIXES_DIR, { recursive: true });
}

function filePath(id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) throw new Error("INVALID_MIX_ID");
  return path.join(MIXES_DIR, `${safe}.json`);
}

export async function listMixes(): Promise<Mix[]> {
  await ensureDir();
  const files = await fs.readdir(MIXES_DIR);
  const mixes = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) => JSON.parse(await fs.readFile(path.join(MIXES_DIR, f), "utf-8")) as Mix)
  );
  return mixes.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMix(id: string): Promise<Mix | null> {
  try {
    return JSON.parse(await fs.readFile(filePath(id), "utf-8"));
  } catch {
    return null;
  }
}

async function saveMix(mix: Mix): Promise<void> {
  await ensureDir();
  await fs.writeFile(filePath(mix.id), JSON.stringify(mix, null, 2), "utf-8");
}

export async function createMix(name: string): Promise<Mix> {
  const mix: Mix = {
    id: randomBytes(6).toString("hex"),
    name,
    createdAt: Date.now(),
    tracks: [],
  };
  await saveMix(mix);
  return mix;
}

export async function renameMix(id: string, name: string): Promise<Mix | null> {
  const mix = await getMix(id);
  if (!mix) return null;
  mix.name = name;
  await saveMix(mix);
  return mix;
}

export async function addTracksToMix(id: string, tracks: MixTrack[]): Promise<Mix | null> {
  const mix = await getMix(id);
  if (!mix) return null;
  const existingIds = new Set(mix.tracks.map((t) => t.id));
  for (const t of tracks) {
    if (!existingIds.has(t.id)) {
      mix.tracks.push(t);
      existingIds.add(t.id);
    }
  }
  await saveMix(mix);
  return mix;
}

export async function setTrackAudio(
  id: string,
  trackId: string,
  audioUrl: string
): Promise<Mix | null> {
  const mix = await getMix(id);
  if (!mix) return null;
  const track = mix.tracks.find((t) => t.id === trackId);
  if (!track) return null;
  track.audioUrl = audioUrl;
  await saveMix(mix);
  return mix;
}

export async function removeTrackFromMix(id: string, trackId: string): Promise<Mix | null> {
  const mix = await getMix(id);
  if (!mix) return null;
  mix.tracks = mix.tracks.filter((t) => t.id !== trackId);
  await saveMix(mix);
  return mix;
}

export async function deleteMix(id: string): Promise<void> {
  try {
    await fs.unlink(filePath(id));
  } catch {
    // 이미 없으면 무시
  }
}
