const FAL_ENDPOINT = "https://fal.run/bytedance/seedance-2.0/fast/text-to-video";

export function isSeedanceEnabled(): boolean {
  return Boolean(process.env.SEEDANCE_API_KEY);
}

// 시덴스는 초당 과금되는 유료 API라 실제 소비되는 가장 저렴한 옵션(fast/480p)만 사용한다.
export function buildVideoPrompt(
  trackName: string,
  artists: string,
  moodNote?: string
): string {
  return [
    `Abstract, atmospheric looping background video capturing the mood of the song "${trackName}" by ${artists}.`,
    moodNote ? `Mood/style notes: ${moodNote}.` : "",
    "No real people, celebrity likeness, logos, or text on screen.",
    "Slow, ambient camera movement suitable as a YouTube background visual.",
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
