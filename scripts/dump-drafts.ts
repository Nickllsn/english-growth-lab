import { readFileSync } from "node:fs";
import { transcriptDrafts } from "../apps/web/src/content/parse-transcript";

const source = readFileSync(process.argv[2], "utf8");
process.stdout.write(JSON.stringify(transcriptDrafts(source)));
