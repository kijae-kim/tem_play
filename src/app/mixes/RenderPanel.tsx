"use client";

import { useEffect, useState } from "react";
import YoutubeUpload from "./YoutubeUpload";

interface TrackRef {
  name: string;
  artists: string;
}

interface Props {
  mixId: string;
  mixName: string;
  tracks: TrackRef[];
  audioReadyCount: number;
  totalTracks: number;
}

export default function RenderPanel({
  mixId,
  mixName,
  tracks,
  audioReadyCount,
  totalTracks,
}: Props) {
  const [videos, setVideos] = useState<string[]>([]);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/mixes/${mixId}/render`)
      .then((r) => r.json())
      .then((d) => setVideos(d.videos ?? []))
      .catch(() => {});
  }, [mixId]);

  async function render() {
    setRendering(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch(`/api/mixes/${mixId}/render`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "영상 생성 실패");
      setVideos((v) => [...v, data.url]);
      if (data.skippedTracks > 0) {
        setNote(`${data.usedTracks}곡으로 만들었습니다. 오디오가 없는 ${data.skippedTracks}곡은 빠졌습니다.`);
      } else {
        setNote(`${data.usedTracks}곡 전부로 영상을 만들었습니다.`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRendering(false);
    }
  }

  const defaultDescription = tracks.map((t) => `${t.name} - ${t.artists}`).join("\n");

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-3">
      <h3 className="font-medium">최종 영상 만들기</h3>
      <p className="text-sm text-gray-500">
        오디오 첨부된 곡 {audioReadyCount}/{totalTracks}개 · 배경 비주얼(위에서 생성/업로드한 것 중 가장 최근 것) +
        오디오를 이어붙여 mp4로 렌더링합니다. 곡이 많으면 시간이 오래 걸릴 수 있어요.
      </p>
      <button
        onClick={render}
        disabled={rendering || audioReadyCount === 0}
        className="self-start rounded-full bg-black text-white text-sm px-4 py-1.5 disabled:opacity-50"
      >
        {rendering ? "렌더링 중... (곡 수에 따라 몇 분~더 걸릴 수 있음)" : "최종 영상 만들기"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {note && <p className="text-green-700 text-sm">{note}</p>}

      {videos.length > 0 && (
        <div className="flex flex-col gap-3">
          {videos
            .slice()
            .reverse()
            .map((v) => (
              <div key={v} className="flex flex-col gap-2">
                <video src={v} controls className="w-full rounded" />
                <a href={v} download className="text-sm text-blue-600 hover:underline">
                  다운로드
                </a>
                <YoutubeUpload
                  mixId={mixId}
                  videoUrl={v}
                  defaultTitle={mixName}
                  defaultDescription={defaultDescription}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
