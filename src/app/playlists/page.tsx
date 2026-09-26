"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

interface MixSummary {
  id: string;
  name: string;
  tracks: TrackInfo[];
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

  const [mixes, setMixes] = useState<MixSummary[]>([]);
  const [selectedMixId, setSelectedMixId] = useState<string>("");
  const [addedTrackIds, setAddedTrackIds] = useState<Set<string>>(new Set());

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

    refreshMixes();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회만 로드
  }, []);

  async function refreshMixes() {
    const res = await fetch("/api/mixes");
    if (res.ok) {
      const data = await res.json();
      setMixes(data.mixes);
      if (!selectedMixId && data.mixes.length > 0) {
        setSelectedMixId(data.mixes[0].id);
      }
    }
  }

  async function createMix() {
    const name = window.prompt("새 믹스 이름을 입력하세요");
    if (!name) return;
    const res = await fetch("/api/mixes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      await refreshMixes();
      setSelectedMixId(data.mix.id);
    }
  }

  async function addTracksToSelectedMix(tracksToAdd: TrackInfo[]) {
    if (!selectedMixId) {
      alert("먼저 믹스를 선택하거나 새로 만들어주세요.");
      return;
    }
    await fetch(`/api/mixes/${selectedMixId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addTracks: tracksToAdd }),
    });
    setAddedTrackIds((prev) => new Set([...prev, ...tracksToAdd.map((t) => t.id)]));
    refreshMixes();
  }

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
        <Link href="/mixes" className="text-sm text-blue-600 hover:underline mb-2">
          내 믹스 관리 →
        </Link>
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

        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-500">담을 믹스:</span>
          <select
            value={selectedMixId}
            onChange={(e) => setSelectedMixId(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">선택 안 함</option>
            {mixes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.tracks.length})
              </option>
            ))}
          </select>
          <button onClick={createMix} className="text-sm text-blue-600 hover:underline">
            + 새 믹스
          </button>
          {tracks.length > 0 && (
            <button
              onClick={() => addTracksToSelectedMix(tracks)}
              className="ml-auto rounded-full bg-black text-white text-sm px-4 py-1.5"
            >
              현재 목록 전체 담기 ({tracks.length}곡)
            </button>
          )}
        </div>

        {!selected && view !== "recent" && (
          <p className="text-gray-500">왼쪽에서 플레이리스트를 선택하세요.</p>
        )}
        <ul className="flex flex-col gap-2">
          {tracks.map((t) => (
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
              <button
                onClick={() => addTracksToSelectedMix([t])}
                className="text-sm rounded-full border px-3 py-1 hover:bg-gray-100"
              >
                {addedTrackIds.has(t.id) ? "담김 ✓" : "+ 담기"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
