import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getAuthorizeUrl } from "@/lib/youtube";
import { savePendingState } from "@/lib/oauth-state";

export async function GET() {
  const state = randomBytes(16).toString("hex");
  await savePendingState("google", state);
  return NextResponse.redirect(getAuthorizeUrl(state));
}
