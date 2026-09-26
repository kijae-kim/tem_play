"use client";

import { useEffect, useState } from "react";

interface Props {
  mixId: string;
  videoUrl: string;
  defaultTitle: string;
  defaultDescription: string;
}

export default function YoutubeUpload({ mixId, videoUrl, defaultTitle, defaultDescription }: Props) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/youtube/config")
      .then((r) => r.json())
      .then((d) => setConnected(d.connected))
      .catch(() => setConnected(false));
  }, []);

  async function upload() {
    const confirmed = window.confirm(
      "이 영상을 유튜브에 '비공개'로 업로드합니다. 실제로 내 채널에 영상이 올라갑니다. 계속할까요?"
    );
    if (!confirmed) return;

    setUploading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mixes/${mixId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, title, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  if (connected === null) return null;

  if (!connected) {
    return (
      <a href="/api/auth/google" className="text-sm text-blue-600 hover:underline">
        유튜브 계정 연결하기
      </a>
    );
  }

  if (result) {
    return (
      <p className="text-sm text-green-700">
        비공개로 업로드 완료:{" "}
        <a href={result.url} target="_blank" rel="noreferrer" className="underline">
          {result.url}
        </a>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-2 mt-1">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
        placeholder="영상 제목"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
        rows={3}
        placeholder="영상 설명"
      />
      <button
        onClick={upload}
        disabled={uploading}
        className="self-start rounded-full bg-red-600 text-white text-sm px-4 py-1.5 disabled:opacity-50"
      >
        {uploading ? "업로드 중..." : "유튜브에 비공개로 업로드"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
