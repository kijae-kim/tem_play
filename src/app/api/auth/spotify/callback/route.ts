import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/spotify";
import { consumePendingState } from "@/lib/oauth-state";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = await consumePendingState("spotify");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?spotify_error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/?spotify_error=invalid_state", req.url)
    );
  }

  await exchangeCodeForTokens(code);

  return NextResponse.redirect(new URL("/playlists", req.url));
}
