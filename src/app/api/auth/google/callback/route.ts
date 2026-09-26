import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/youtube";
import { consumePendingState } from "@/lib/oauth-state";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = await consumePendingState("google");

  if (error) {
    return NextResponse.redirect(
      new URL(`/mixes?google_error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(new URL("/mixes?google_error=invalid_state", req.url));
  }

  try {
    await exchangeCodeForTokens(code);
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(`/mixes?google_error=${encodeURIComponent(e.message)}`, req.url)
    );
  }

  return NextResponse.redirect(new URL("/mixes", req.url));
}
