export interface TrackRef {
  name: string;
  artists: string;
}

// 믹스 전체를 대표하는 비주얼을 만들기 위해, 프롬프트가 너무 길어지지 않도록
// 트랙 목록에서 일부만 뽑아 "제목 - 아티스트" 형태로 요약한다.
export function summarizeTracks(tracks: TrackRef[], limit = 8): string {
  const sample = tracks.slice(0, limit).map((t) => `${t.name} - ${t.artists}`);
  const suffix = tracks.length > limit ? ` 외 ${tracks.length - limit}곡` : "";
  return sample.join(", ") + suffix;
}
