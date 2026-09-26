"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MixSummary {
  id: string;
  name: string;
  createdAt: number;
  tracks: { id: string }[];
}

export default function MixesPage() {
  const [mixes, setMixes] = useState<MixSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mixes")
      .then((r) => r.json())
      .then((d) => setMixes(d.mixes))
      .finally(() => setLoading(false));
  }, []);

  async function createMix() {
    const name = window.prompt("새 믹스 이름을 입력하세요");
    if (!name) return;
    await fetch("/api/mixes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const res = await fetch("/api/mixes");
    setMixes((await res.json()).mixes);
  }

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">내 믹스</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/playlists" className="text-blue-600 hover:underline">
            ← 스포티파이에서 곡 담기
          </Link>
          <button onClick={createMix} className="text-blue-600 hover:underline">
            + 새 믹스
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-500">불러오는 중...</p>}
      {!loading && mixes.length === 0 && (
        <p className="text-gray-500">
          아직 만든 믹스가 없습니다. 플레이리스트 페이지에서 곡을 담아 새 믹스를 만들어보세요.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {mixes.map((m) => (
          <li key={m.id}>
            <Link
              href={`/mixes/${m.id}`}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
            >
              <span className="font-medium">{m.name}</span>
              <span className="text-sm text-gray-500">{m.tracks.length}곡</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
