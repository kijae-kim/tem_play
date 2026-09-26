import { GoogleGenAI } from "@google/genai";
import { summarizeTracks, type TrackRef } from "./prompt-utils";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  return new GoogleGenAI({ apiKey });
}

// 개별 곡이 아니라 믹스(플레이리스트) 전체를 대표하는 비주얼 1장을 만든다.
// moodNote로 영화/소설/드라마/애니메이션/웹툰 장면을 참고해달라고 적을 수 있는데,
// 이 경우 그 장면을 그대로 베끼지 않고 분위기만 딴 "재해석"을 만들도록 지시한다.
// 실제 배우/유명인의 얼굴은 절대 생성하지 않지만, 장면에 어울리는 가상의 인물 실루엣은 허용한다.
export function buildImagePrompt(
  mixName: string,
  tracks: TrackRef[],
  moodNote?: string
): string {
  return [
    `Cinematic, illustrated cover-art style background visual for a curated music mix/playlist called "${mixName}".`,
    `The mix contains songs like: ${summarizeTracks(tracks)}.`,
    moodNote
      ? `Style/scene reference: ${moodNote}. Create an original illustrated reinterpretation inspired by that mood, genre, and color palette — do not reproduce any exact shot, frame, or copyrighted artwork.`
      : "",
    "Do not depict any real actor, celebrity, or identifiable real person's likeness, and do not include any logos or watermarks.",
    "Fictional, anonymous human silhouettes or characters are fine when they fit the scene.",
    "No on-image text.",
    "16:9 cinematic composition suitable as a looping YouTube background visual for the whole mix.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateTrackImage(prompt: string): Promise<Buffer> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }
  throw new Error("나노바나나 응답에 이미지 데이터가 없습니다.");
}
