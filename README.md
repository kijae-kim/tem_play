# mk_playlist

스포티파이 플레이리스트(메타데이터만) → 곡을 골라 "믹스"로 큐레이션 → 나노바나나/시덴스로 믹스 전체 비주얼 생성 또는 직접 편집한 파일 업로드 → 곡마다 로열티프리 음원 첨부 → ffmpeg로 (비주얼 루프 + 음원 이어붙이기) 합성해 essential; 스타일의 긴 플레이리스트 영상 mp4로 뽑기 → 유튜브 업로드까지 이어주는 개인용 도구. 나만 쓰는 로컬 웹앱이라 배포 없이 `localhost`에서 실행합니다.

## 사전 준비 (도구)

- **ffmpeg** — 최종 영상 렌더링에 필수. `brew install ffmpeg` (Mac) 등으로 미리 설치되어 있어야 합니다.

## 사전 준비 (API 키 발급)

### 1. Spotify (트랙 목록/최근 청취곡 조회 전용 — 음원 파일 접근 불가)
1. https://developer.spotify.com/dashboard 접속 → **Create app**
2. Redirect URI에 정확히 입력: `http://127.0.0.1:3000/api/auth/spotify/callback`
3. 발급된 **Client ID / Client Secret** 을 `.env.local`에 입력

### 2. Google — YouTube 업로드
1. https://console.cloud.google.com 에서 새 프로젝트 생성
2. "API 및 서비스 > 라이브러리"에서 **YouTube Data API v3** 활성화
3. "사용자 인증 정보 > OAuth 클라이언트 ID 만들기" → 애플리케이션 유형 **데스크톱 앱**
4. OAuth 동의 화면에서 테스트 사용자로 본인 구글 계정 추가 (개인용이라 게시 심사 불필요)
5. 발급된 **클라이언트 ID / 보안 비밀번호**를 `.env.local`에 입력

### 3. Google AI Studio — 나노바나나(이미지 생성, 무료)
1. https://aistudio.google.com/apikey 에서 API 키 발급 (신용카드 불필요)
2. 하루 500장까지 무료 (Gemini 2.5 Flash Image)
3. `.env.local`의 `GEMINI_API_KEY`에 입력

### 4. Seedance (선택, 영상 생성 — 유료)
- 무료 티어 없음. 초당 과금 (미니 480p 기준 초당 약 $0.04~)
- fal.ai 또는 BytePlus에서 키 발급 후 `SEEDANCE_API_KEY`에 입력
- 비워두면 앱에서 시덴스 생성 버튼이 자동 비활성화됨

## 로컬 실행

```bash
cp .env.local.example .env.local   # 위에서 발급한 키 채워넣기
npm run dev
```

## 로드맵

- [x] Phase 0 — 프로젝트 스캐폴딩
- [x] Phase 1 — Spotify 로그인 및 플레이리스트/최근 청취곡 불러오기
- [x] Phase 2 — 스포티파이 플레이리스트에서 곡을 골라 "믹스"로 큐레이션, 믹스 전체를 대표하는 나노바나나 이미지 생성 (+ 선택적 시덴스 영상 생성), 직접 업로드한 미디어 지원
- [x] Phase 3 — 곡마다 로열티프리 음원 첨부, ffmpeg로 배경 비주얼 루프 + 음원 이어붙이기 → 최종 mp4 렌더링
- [ ] Phase 4 — 유튜브 업로드 자동화
- [ ] Phase 5 — 트랙 간 크로스페이드 믹싱

## 중요한 제약

- 스포티파이 API로는 **음원 파일을 가져올 수 없습니다.** 트랙명/아티스트 등 메타데이터만 사용하고, 실제 배경음악은 유튜브 오디오 라이브러리 등 로열티프리 소스에서 별도로 가져옵니다.
- 시덴스는 호출할 때마다 실제 비용이 발생하므로, UI에서 예상 비용을 보여주고 명시적으로 눌렀을 때만 호출합니다.
