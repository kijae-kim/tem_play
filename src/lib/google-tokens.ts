import { promises as fs } from "fs";
import path from "path";

const TOKENS_PATH = path.join(process.cwd(), "data", "google-tokens.json");

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
}

export async function readGoogleTokens(): Promise<GoogleTokens | null> {
  try {
    const raw = await fs.readFile(TOKENS_PATH, "utf-8");
    return JSON.parse(raw) as GoogleTokens;
  } catch {
    return null;
  }
}

export async function writeGoogleTokens(tokens: GoogleTokens): Promise<void> {
  await fs.mkdir(path.dirname(TOKENS_PATH), { recursive: true });
  await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2), "utf-8");
}
