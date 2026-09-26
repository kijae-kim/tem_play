import { NextResponse } from "next/server";
import { createMix, listMixes } from "@/lib/mixes";

export async function GET() {
  const mixes = await listMixes();
  return NextResponse.json({ mixes });
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name은 필수입니다." }, { status: 400 });
  }
  const mix = await createMix(name);
  return NextResponse.json({ mix });
}
