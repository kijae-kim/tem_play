import { readTokens, writeTokens } from "./spotify-tokens";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

// 음원 파일이나 재생 제어는 요청하지 않고, 메타데이터 조회 권한만 요청한다.
const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-recently-played",
  "user-top-read",
].join(" ");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} 환경변수가 설정되지 않았습니다.`);
  return value;
}

export function getAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("SPOTIFY_CLIENT_ID"),
    response_type: "code",
    redirect_uri: requireEnv("SPOTIFY_REDIRECT_URI"),
    scope: SCOPES,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function requestToken(body: URLSearchParams) {
  const basicAuth = Buffer.from(
    `${requireEnv("SPOTIFY_CLIENT_ID")}:${requireEnv("SPOTIFY_CLIENT_SECRET")}`
  ).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Spotify 토큰 요청 실패 (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const data = await requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: requireEnv("SPOTIFY_REDIRECT_URI"),
    })
  );

  await writeTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  });
}

async function refreshTokens(refreshToken: string) {
  const data = await requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
  );

  await writeTokens({
    access_token: data.access_token,
    // Spotify가 새 refresh_token을 안 줄 수도 있어 기존 값을 유지
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
  });

  return data.access_token as string;
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await readTokens();
  if (!tokens) return null;

  // 만료 60초 전이면 미리 갱신
  if (Date.now() > tokens.expires_at - 60_000) {
    return refreshTokens(tokens.refresh_token);
  }
  return tokens.access_token;
}

async function spotifyFetch(endpoint: string) {
  const accessToken = await getValidAccessToken();
  if (!accessToken) throw new Error("NOT_AUTHENTICATED");

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Spotify API 요청 실패 (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export interface SpotifyPlaylistSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
}

export interface SpotifyTrackInfo {
  id: string;
  name: string;
  artists: string;
  albumImageUrl: string | null;
  durationMs: number;
}

export async function fetchMyPlaylists(): Promise<SpotifyPlaylistSummary[]> {
  const data = await spotifyFetch("/me/playlists?limit=50");
  return (data.items ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.images?.[0]?.url ?? null,
    // 2026-03 API 마이그레이션으로 playlist.tracks → playlist.items 로 필드명이 바뀜
    trackCount: p.items?.total ?? 0,
  }));
}

export async function fetchPlaylistTracks(
  playlistId: string
): Promise<SpotifyTrackInfo[]> {
  // 2026-03 API 마이그레이션으로 /tracks 엔드포인트가 /items 로 이전됨 (track → item)
  const data = await spotifyFetch(
    `/playlists/${playlistId}/items?limit=100&fields=items(item(id,name,duration_ms,artists(name),album(images)))`
  );
  return (data.items ?? [])
    .filter((entry: any) => entry.item)
    .map((entry: any) => ({
      id: entry.item.id,
      name: entry.item.name,
      artists: (entry.item.artists ?? []).map((a: any) => a.name).join(", "),
      albumImageUrl: entry.item.album?.images?.[0]?.url ?? null,
      durationMs: entry.item.duration_ms,
    }));
}

export async function fetchRecentlyPlayed(): Promise<SpotifyTrackInfo[]> {
  const data = await spotifyFetch("/me/player/recently-played?limit=50");
  return (data.items ?? []).map((item: any) => ({
    id: item.track.id,
    name: item.track.name,
    artists: (item.track.artists ?? []).map((a: any) => a.name).join(", "),
    albumImageUrl: item.track.album?.images?.[0]?.url ?? null,
    durationMs: item.track.duration_ms,
  }));
}
