import { NextResponse } from "next/server";
import { isSeedanceEnabled } from "@/lib/seedance";

export async function GET() {
  return NextResponse.json({ seedanceEnabled: isSeedanceEnabled() });
}
