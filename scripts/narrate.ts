import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { englishNarration, pageReadings } from "../apps/web/src/content/page-text.ts";

const outDir = new URL("../apps/web/public/audio/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const python = `
import asyncio, sys
import edge_tts

async def main():
    text = sys.stdin.read()
    voice = edge_tts.Communicate(text, "en-US-JennyNeural", rate="-10%")
    await voice.save(sys.argv[1])

asyncio.run(main())
`;

function synthesize(text: string, dest: URL): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", ["-c", python, dest.pathname], { stdio: ["pipe", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`朗读生成失败 ${dest.pathname} (${code})`));
    });
    child.stdin.write(text);
    child.stdin.end();
  });
}

const manifest: Record<string, string> = {};
const readings = Object.values(pageReadings);
for (const reading of readings) {
  const script = englishNarration(reading.paragraphs);
  if (!script.trim()) throw new Error(`${reading.audio} 没有英文`);
  manifest[reading.audio] = createHash("sha256").update(script).digest("hex");
  const dest = new URL(reading.audio, outDir);
  process.stdout.write(`朗读 ${reading.audio}\n`);
  await synthesize(script, dest);
}

writeFileSync(new URL("manifest.json", outDir), `${JSON.stringify(manifest, null, 2)}\n`);
