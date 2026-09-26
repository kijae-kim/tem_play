import { GoogleGenAI } from "@google/genai";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  return new GoogleGenAI({ apiKey });
}

// 실제 아티스트의 얼굴/초상을 생성하지 않도록 분위기·색감 중심의 추상적 비주얼만 요청한다.
export function buildImagePrompt(
  trackName: string,
  artists: string,
  moodNote?: string
): string {
  return [
    `Abstract, atmospheric album-art style background visual inspired by the mood of the song "${trackName}" by ${artists}.`,
    moodNote ? `Mood/style notes: ${moodNote}.` : "",
    "Do not depict any real person, celebrity likeness, band members, logos, or text.",
    "Focus on color, light, texture and abstract shapes suitable as a looping YouTube background visual.",
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
