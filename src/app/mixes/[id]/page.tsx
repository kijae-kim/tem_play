"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import MixMediaPanel from "../MixMediaPanel";
import RenderPanel from "../RenderPanel";

interface MixTrack {
  id: string;
  name: string;
  artists: string;
  albumImageUrl: string | null;
  durationMs: number;
  audioUrl?: string;
}

interface Mix {
  id: string;
  name: string;
  createdAt: number;
  tracks: MixTrack[];
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function MixDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mix, setMix] = useState<Mix | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [uploadingTrackId, setUploadingTrackId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/mixes/${id}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await r.json();
        setMix(data.mix);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function removeTrack(trackId: string) {
    const res = await fetch(`/api/mixes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeTrackId: trackId }),
    });
    const data = await res.json();
    setMix(data.mix);
  }

  async function renameMix() {
    if (!mix) return;
    const name = window.prompt("믹스 이름", mix.name);
    if (!name) return;
    const res = await fetch(`/api/mixes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setMix(data.mix);
  }

  async function attachAudio(trackId: string, file: File) {
    setUploadingTrackId(trackId);
    try {
      const form = new FormData();
      form.set("trackId", trackId);
      form.set("file", file);
      const res = await fetch(`/api/mixes/${id}/audio`, { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) setMix(data.mix);
      else alert(data.error ?? "오디오 업로드 실패");
    } finally {
      setUploadingTrackId(null);
    }
  }

  if (loading) return <main className="p-8">불러오는 중...</main>;
  if (notFound) return <main className="p-8">믹스를 찾을 수 없습니다.</main>;
  if (!mix) return null;

  const audioReadyCount = mix.tracks.filter((t) => t.audioUrl).length;

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <Link href="/mixes" className="text-sm text-blue-600 hover:underline">
        ← 내 믹스
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{mix.name}</h1>
        <div className="flex gap-3 text-sm">
          <button onClick={renameMix} className="text-blue-600 hover:underline">
            이름 변경
          </button>
          <Link href="/playlists" className="text-blue-600 hover:underline">
            + 곡 더 담기
          </Link>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {mix.tracks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            {t.albumImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.albumImageUrl} alt="" className="w-10 h-10 rounded object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">{t.name}</div>
              <div className="truncate text-sm text-gray-500">{t.artists}</div>
            </div>
            <div className="text-sm text-gray-400">{formatDuration(t.durationMs)}</div>
            <label className="text-sm rounded-full border px-3 py-1 hover:bg-gray-100 cursor-pointer">
              {uploadingTrackId === t.id ? "업로드 중..." : t.audioUrl ? "음원 🎵 ✓" : "음원 붙이기"}
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) attachAudio(t.id, file);
                }}
              />
            </label>
            <button
              onClick={() => removeTrack(t.id)}
              className="text-sm text-red-600 hover:underline"
            >
              제거
            </button>
          </li>
        ))}
        {mix.tracks.length === 0 && (
          <p className="text-gray-500">아직 담긴 곡이 없습니다.</p>
        )}
      </ul>

      <MixMediaPanel
        mixId={mix.id}
        mixName={mix.name}
        tracks={mix.tracks.map((t) => ({ name: t.name, artists: t.artists }))}
      />

      <RenderPanel
        mixId={mix.id}
        mixName={mix.name}
        tracks={mix.tracks.map((t) => ({ name: t.name, artists: t.artists }))}
        audioReadyCount={audioReadyCount}
        totalTracks={mix.tracks.length}
      />
    </main>
  );
}
