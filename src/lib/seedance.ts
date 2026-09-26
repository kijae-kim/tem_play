import { summarizeTracks, type TrackRef } from "./prompt-utils";

const FAL_ENDPOINT = "https://fal.run/bytedance/seedance-2.0/fast/text-to-video";

export function isSeedanceEnabled(): boolean {
  return Boolean(process.env.SEEDANCE_API_KEY);
}

// 개별 곡이 아니라 믹스(플레이리스트) 전체를 대표하는 영상 1개를 만든다.
// moodNote로 영화/소설/드라마/애니메이션/웹툰 장면을 참고해달라고 적을 수 있는데,
// 이 경우 그 장면을 그대로 베끼지 않고 분위기만 딴 "재해석"을 만들도록 지시한다.
// 시덴스는 초당 과금되는 유료 API라 실제 소비되는 가장 저렴한 옵션(fast/480p)만 사용한다.
export function buildVideoPrompt(
  mixName: string,
  tracks: TrackRef[],
  moodNote?: string
): string {
  return [
    `Cinematic, illustrated looping background video capturing the overall mood of a curated music mix called "${mixName}".`,
    `The mix contains songs like: ${summarizeTracks(tracks)}.`,
    moodNote
      ? `Style/scene reference: ${moodNote}. Create an original reinterpretation inspired by that mood, genre, and color palette — do not reproduce any exact shot or copyrighted footage.`
      : "",
    "Do not depict any real actor, celebrity, or identifiable real person's likeness, and no logos or on-screen text.",
    "Fictional, anonymous human silhouettes or characters are fine when they fit the scene.",
    "Slow, ambient camera movement suitable as a YouTube background visual for the whole mix.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateTrackVideo(
  prompt: string,
  durationSeconds: number = 5
): Promise<Buffer> {
  const apiKey = process.env.SEEDANCE_API_KEY;
  if (!apiKey) throw new Error("SEEDANCE_API_KEY 환경변수가 설정되지 않았습니다.");

  const res = await fetch(FAL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      resolution: "480p",
      duration: String(durationSeconds),
      aspect_ratio: "16:9",
      generate_audio: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Seedance API 요청 실패 (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const videoUrl = data?.video?.url;
  if (!videoUrl) throw new Error("Seedance 응답에 video.url이 없습니다.");

  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error("생성된 영상 다운로드에 실패했습니다.");
  return Buffer.from(await videoRes.arrayBuffer());
}
