import { GoogleGenAI } from "@google/genai";
import { summarizeTracks, type TrackRef } from "./prompt-utils";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  return new GoogleGenAI({ apiKey });
}

// 개별 곡이 아니라 믹스(플레이리스트) 전체를 대표하는 비주얼 1장을 만든다.
// 실제 아티스트의 얼굴/초상을 생성하지 않도록 분위기·색감 중심의 추상적 비주얼만 요청한다.
export function buildImagePrompt(
  mixName: string,
  tracks: TrackRef[],
  moodNote?: string
): string {
  return [
    `Abstract, atmospheric cover-art style background visual for a curated music mix/playlist called "${mixName}".`,
    `The mix contains songs like: ${summarizeTracks(tracks)}.`,
    moodNote ? `Mood/style notes: ${moodNote}.` : "",
    "Do not depict any real person, celebrity likeness, band members, logos, or text.",
    "Focus on color, light, texture and abstract shapes suitable as a looping YouTube background visual for the whole mix.",
    "16:9 cinematic composition.",
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
