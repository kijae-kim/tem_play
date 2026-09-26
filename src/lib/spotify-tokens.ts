import { promises as fs } from "fs";
import path from "path";

const TOKENS_PATH = path.join(process.cwd(), "data", "spotify-tokens.json");

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
}

export async function readTokens(): Promise<SpotifyTokens | null> {
  try {
    const raw = await fs.readFile(TOKENS_PATH, "utf-8");
    return JSON.parse(raw) as SpotifyTokens;
  } catch {
    return null;
  }
}

export async function writeTokens(tokens: SpotifyTokens): Promise<void> {
  await fs.mkdir(path.dirname(TOKENS_PATH), { recursive: true });
  await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2), "utf-8");
}
