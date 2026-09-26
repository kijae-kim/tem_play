import { NextResponse } from "next/server";
import {
  addTracksToMix,
  deleteMix,
  getMix,
  removeTrackFromMix,
  renameMix,
} from "@/lib/mixes";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mix = await getMix(id);
  if (!mix) return NextResponse.json({ error: "믹스를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ mix });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  let mix = await getMix(id);
  if (!mix) return NextResponse.json({ error: "믹스를 찾을 수 없습니다." }, { status: 404 });

  if (typeof body.name === "string") {
    mix = await renameMix(id, body.name);
  }
  if (Array.isArray(body.addTracks)) {
    mix = await addTracksToMix(id, body.addTracks);
  }
  if (typeof body.removeTrackId === "string") {
    mix = await removeTrackFromMix(id, body.removeTrackId);
  }

  return NextResponse.json({ mix });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteMix(id);
  return NextResponse.json({ ok: true });
}
