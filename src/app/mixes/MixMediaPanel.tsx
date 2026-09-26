"use client";

import { useEffect, useState } from "react";

interface TrackRef {
  name: string;
  artists: string;
}

interface Props {
  mixId: string;
  mixName: string;
  tracks: TrackRef[];
}

interface MixMedia {
  images: string[];
  videos: string[];
  uploads: string[];
}

const EMPTY_MEDIA: MixMedia = { images: [], videos: [], uploads: [] };

export default function MixMediaPanel({ mixId, mixName, tracks }: Props) {
  const [media, setMedia] = useState<MixMedia>(EMPTY_MEDIA);
  const [moodNote, setMoodNote] = useState("");
  const [seedanceEnabled, setSeedanceEnabled] = useState(false);
  const [busy, setBusy] = useState<"image" | "video" | "upload" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/media/${mixId}`)
      .then((r) => r.json())
      .then(setMedia)
      .catch(() => {});
    fetch("/api/media/config")
      .then((r) => r.json())
      .then((d) => setSeedanceEnabled(d.seedanceEnabled))
      .catch(() => {});
  }, [mixId]);

  async function generateImage() {
    setBusy("image");
    setError(null);
    try {
      const res = await fetch("/api/media/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mixId, mixName, tracks, moodNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "이미지 생성 실패");
      setMedia((m) => ({ ...m, images: [...m.images, data.url] }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function generateVideo() {
    const confirmed = window.confirm(
      "시덴스 영상 생성은 fal.ai 계정에 실제 비용이 청구됩니다 (5초 클립 기준 대략 $0.3~1, 정확한 금액은 fal.ai 대시보드에서 확인하세요). 계속할까요?"
    );
    if (!confirmed) return;

    setBusy("video");
    setError(null);
    try {
      const res = await fetch("/api/media/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mixId, mixName, tracks, moodNote, durationSeconds: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "영상 생성 실패");
      setMedia((m) => ({ ...m, videos: [...m.videos, data.url] }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy("upload");
    setError(null);
    try {
      const form = new FormData();
      form.set("mixId", mixId);
      form.set("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      setMedia((m) => ({ ...m, uploads: [...m.uploads, data.url] }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-3">
      <h3 className="font-medium">이 믹스의 비주얼</h3>
      <input
        type="text"
        placeholder="무드/스타일 메모 (선택, 예: 몽환적인 네온 컬러, 비 내리는 도시)"
        value={moodNote}
        onChange={(e) => setMoodNote(e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={generateImage}
          disabled={busy !== null || tracks.length === 0}
          className="rounded-full bg-black text-white text-sm px-4 py-1.5 disabled:opacity-50"
        >
          {busy === "image" ? "생성 중..." : "이미지 생성 (나노바나나, 무료)"}
        </button>
        <button
          onClick={generateVideo}
          disabled={busy !== null || !seedanceEnabled || tracks.length === 0}
          title={seedanceEnabled ? "" : "SEEDANCE_API_KEY가 설정되지 않았습니다"}
          className="rounded-full bg-purple-700 text-white text-sm px-4 py-1.5 disabled:opacity-40"
        >
          {busy === "video" ? "생성 중... (1~2분)" : "영상 생성 (시덴스, 유료)"}
        </button>
        <label className="rounded-full border text-sm px-4 py-1.5 cursor-pointer">
          {busy === "upload" ? "업로드 중..." : "직접 업로드"}
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {tracks.length === 0 && (
        <p className="text-sm text-gray-400">먼저 트랙을 담아야 비주얼을 생성할 수 있어요.</p>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {(media.images.length > 0 || media.videos.length > 0 || media.uploads.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {media.images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="w-40 h-40 object-cover rounded" />
          ))}
          {media.videos.map((src) => (
            <video key={src} src={src} controls className="w-56 h-40 object-cover rounded" />
          ))}
          {media.uploads.map((src) =>
            src.match(/\.(mp4|mov|webm)$/i) ? (
              <video key={src} src={src} controls className="w-56 h-40 object-cover rounded" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="w-40 h-40 object-cover rounded" />
            )
          )}
        </div>
      )}
    </div>
  );
}
