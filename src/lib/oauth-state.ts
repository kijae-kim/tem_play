import { promises as fs } from "fs";
import path from "path";

// 개인용 단일 사용자 로컬 앱이므로, 브라우저가 127.0.0.1/localhost를 오갈 때
// 쿠키가 유실되는 문제를 피하기 위해 OAuth state를 서버 파일에 저장한다.
const STATE_PATH = path.join(process.cwd(), "data", "oauth-state.json");
const STATE_TTL_MS = 10 * 60 * 1000;

export async function savePendingState(key: string, state: string): Promise<void> {
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  let all: Record<string, { state: string; createdAt: number }> = {};
  try {
    all = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
  } catch {
    // 파일 없으면 새로 시작
  }
  all[key] = { state, createdAt: Date.now() };
  await fs.writeFile(STATE_PATH, JSON.stringify(all, null, 2), "utf-8");
}

export async function consumePendingState(key: string): Promise<string | null> {
  try {
    const all = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
    const entry = all[key];
    delete all[key];
    await fs.writeFile(STATE_PATH, JSON.stringify(all, null, 2), "utf-8");
    if (!entry || Date.now() - entry.createdAt > STATE_TTL_MS) return null;
    return entry.state;
  } catch {
    return null;
  }
}
