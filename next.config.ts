import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Spotify/Google OAuth redirect URI가 127.0.0.1을 쓰므로 그 origin에서의
  // dev 요청(HMR 등)을 허용해야 로컬 개발 중 화면이 멈추지 않는다.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
