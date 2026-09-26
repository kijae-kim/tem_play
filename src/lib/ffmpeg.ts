import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => reject(new Error(`${cmd} 실행 실패: ${err.message}`)));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} 종료 코드 ${code}\n${stderr.slice(-2000)}`));
    });
  });
}

export async function probeDurationSeconds(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => reject(new Error(`ffprobe 실행 실패: ${err.message}`)));
    proc.on("close", (code) => {
      if (code === 0) resolve(parseFloat(stdout.trim()));
      else reject(new Error(`ffprobe 종료 코드 ${code}\n${stderr.slice(-2000)}`));
    });
  });
}

// 여러 로열티프리 음원 파일을 순서대로 이어붙여 믹스 전체 길이의 오디오 트랙 하나로 만든다.
// 입력 파일들의 코덱/샘플레이트가 서로 달라도 되도록 concat demuxer + 재인코딩을 쓴다.
export async function concatAudio(files: string[], outPath: string): Promise<void> {
  if (files.length === 0) throw new Error("이어붙일 오디오 파일이 없습니다.");

  const listPath = path.join(os.tmpdir(), `mkplaylist-concat-${Date.now()}.txt`);
  const listContent = files
    .map((f) => `file '${f.replace(/'/g, "'\\''")}'`)
    .join("\n");
  await fs.writeFile(listPath, listContent, "utf-8");

  try {
    await run("ffmpeg", [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-ar",
      "44100",
      "-ac",
      "2",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      outPath,
    ]);
  } finally {
    await fs.unlink(listPath).catch(() => {});
  }
}

interface RenderOptions {
  backgroundImagePath?: string;
  backgroundVideoPath?: string;
  audioPath: string;
  outPath: string;
}

// 유튜브 표준 16:9. 나노바나나는 정사각형(1024x1024)을 주기 때문에 레터박스로 맞춘다.
const OUTPUT_FILTER =
  "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1";

// 배경 비주얼(이미지 or 영상)을 오디오 길이만큼 루프시켜 최종 mp4를 만든다.
export async function renderFinalVideo(opts: RenderOptions): Promise<void> {
  if (!opts.backgroundImagePath && !opts.backgroundVideoPath) {
    throw new Error("배경 이미지나 영상이 필요합니다.");
  }

  const args = ["-y"];
  if (opts.backgroundVideoPath) {
    args.push("-stream_loop", "-1", "-i", opts.backgroundVideoPath);
  } else {
    args.push("-loop", "1", "-i", opts.backgroundImagePath!);
  }
  args.push(
    "-i",
    opts.audioPath,
    "-vf",
    OUTPUT_FILTER,
    "-c:v",
    "libx264",
    ...(opts.backgroundVideoPath ? [] : ["-tune", "stillimage"]),
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    opts.outPath
  );

  await run("ffmpeg", args);
}
