import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getAuthorizeUrl } from "@/lib/spotify";
import { savePendingState } from "@/lib/oauth-state";

export async function GET() {
  const state = randomBytes(16).toString("hex");
  await savePendingState("spotify", state);
  return NextResponse.redirect(getAuthorizeUrl(state));
}
