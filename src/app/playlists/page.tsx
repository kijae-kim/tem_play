"use client";

import { useEffect, useState } from "react";
import TrackMediaPanel from "./TrackMediaPanel";

interface PlaylistSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
}

interface TrackInfo {
  id: string;
  name: string;
  artists: string;
  albumImageUrl: string | null;
  durationMs: number;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PlaylistsPage() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [selected, setSelected] = useState<PlaylistSummary | null>(null);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [view, setView] = useState<"playlists" | "recent">("playlists");
  const [error, setError] = useState<string | null>(null);
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/spotify/playlists")
      .then(async (res) => {
        if (res.status === 401) {
          setNeedsAuth(true);
          return;
        }
        if (!res.ok) throw new Error((await res.json()).error ?? "불러오기 실패");
        const data = await res.json();
        setPlaylists(data.playlists);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function openPlaylist(playlist: PlaylistSummary) {
    setSelected(playlist);
    setView("playlists");
    setError(null);
    try {
      const res = await fetch(`/api/spotify/playlists/${playlist.id}`);
      if (!res.ok) throw new Error((await res.json()).error ?? "트랙 불러오기 실패");
      const data = await res.json();
      setTracks(data.tracks);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadRecentlyPlayed() {
    setSelected(null);
    setView("recent");
    setError(null);
    try {
      const res = await fetch("/api/spotify/recent");
      if (!res.ok) throw new Error((await res.json()).error ?? "불러오기 실패");
      const data = await res.json();
      setTracks(data.tracks);
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) {
    return <main className="p-8">불러오는 중...</main>;
  }

  if (needsAuth) {
    return (
      <main className="p-8 flex flex-col items-center gap-4">
        <p>스포티파이 계정 연동이 필요합니다.</p>
        <a
          href="/api/auth/spotify"
          className="rounded-full bg-green-600 text-white px-6 py-2 font-medium hover:bg-green-700"
        >
          Spotify로 연결하기
        </a>
      </main>
    );
  }

  return (
    <main className="p-8 grid grid-cols-[280px_1fr] gap-8 min-h-screen">
      <aside className="flex flex-col gap-2">
        <button
          onClick={loadRecentlyPlayed}
          className={`text-left px-3 py-2 rounded-lg ${
            view === "recent" ? "bg-black text-white" : "hover:bg-gray-100"
          }`}
        >
          최근 청취곡
        </button>
        <div className="text-sm text-gray-500 mt-4 mb-1 px-3">내 플레이리스트</div>
        {playlists.map((p) => (
          <button
            key={p.id}
            onClick={() => openPlaylist(p)}
            className={`text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
              selected?.id === p.id ? "bg-black text-white" : "hover:bg-gray-100"
            }`}
          >
            {p.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
            )}
            <span className="truncate">
              {p.name} <span className="opacity-60">({p.trackCount})</span>
            </span>
          </button>
        ))}
      </aside>

      <section>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {!selected && view !== "recent" && (
          <p className="text-gray-500">왼쪽에서 플레이리스트를 선택하세요.</p>
        )}
        <ul className="flex flex-col gap-2">
          {tracks.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setExpandedTrackId(expandedTrackId === t.id ? null : t.id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left"
              >
                {t.albumImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.albumImageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{t.name}</div>
                  <div className="truncate text-sm text-gray-500">{t.artists}</div>
                </div>
                <div className="text-sm text-gray-400">{formatDuration(t.durationMs)}</div>
              </button>
              {expandedTrackId === t.id && (
                <TrackMediaPanel trackId={t.id} trackName={t.name} artists={t.artists} />
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
