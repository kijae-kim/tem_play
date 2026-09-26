import { google } from "googleapis";
import fs from "fs";
import { readGoogleTokens, writeGoogleTokens } from "./google-tokens";

// 실제로 영상을 올리는 것 외에는 요청하지 않는다 (읽기 전용 권한 등은 불필요).
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} 환경변수가 설정되지 않았습니다.`);
  return value;
}

function createOAuthClient() {
  return new google.auth.OAuth2(
    requireEnv("GOOGLE_CLIENT_ID"),
    requireEnv("GOOGLE_CLIENT_SECRET"),
    requireEnv("GOOGLE_REDIRECT_URI")
  );
}

export function getAuthorizeUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // refresh_token을 매번 받기 위해 강제로 동의 화면을 띄운다
    scope: SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error(
      "구글이 refresh_token을 주지 않았습니다. Google 계정 설정에서 이 앱의 연결을 해제한 뒤 다시 시도해주세요."
    );
  }
  await writeGoogleTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiry_date,
  });
}

export async function isYoutubeConnected(): Promise<boolean> {
  return (await readGoogleTokens()) !== null;
}

async function getAuthedClient() {
  const stored = await readGoogleTokens();
  if (!stored) throw new Error("NOT_AUTHENTICATED");

  const client = createOAuthClient();
  client.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    expiry_date: stored.expires_at,
  });

  // 만료 임박이면 미리 갱신하고 새 토큰을 저장한다.
  if (Date.now() > stored.expires_at - 60_000) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
    await writeGoogleTokens({
      access_token: credentials.access_token!,
      refresh_token: credentials.refresh_token ?? stored.refresh_token,
      expires_at: credentials.expiry_date!,
    });
  }

  return client;
}

export interface UploadOptions {
  filePath: string;
  title: string;
  description: string;
  tags?: string[];
}

export async function uploadVideo(opts: UploadOptions): Promise<{ videoId: string; url: string }> {
  const auth = await getAuthedClient();
  const youtube = google.youtube({ version: "v3", auth });

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: opts.title,
        description: opts.description,
        tags: opts.tags,
      },
      status: {
        // 검수 전에 실수로 공개되지 않도록 항상 비공개로 업로드한다.
        privacyStatus: "private",
      },
    },
    media: {
      body: fs.createReadStream(opts.filePath),
    },
  });

  const videoId = res.data.id;
  if (!videoId) throw new Error("유튜브 응답에 video id가 없습니다.");
  return { videoId, url: `https://youtu.be/${videoId}` };
}
