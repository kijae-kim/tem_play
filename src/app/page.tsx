import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold">mk_playlist</h1>
      <p className="max-w-md text-gray-500">
        스포티파이 플레이리스트를 참고해 로열티프리 음원과 어울리는 영상을 만들고
        유튜브에 올리는 개인용 도구입니다.
      </p>
      <div className="flex gap-3">
        <Link
          href="/playlists"
          className="rounded-full bg-black text-white px-6 py-3 font-medium hover:bg-gray-800"
        >
          스포티파이에서 곡 담기
        </Link>
        <Link
          href="/mixes"
          className="rounded-full border px-6 py-3 font-medium hover:bg-gray-50"
        >
          내 믹스
        </Link>
      </div>
    </main>
  );
}
