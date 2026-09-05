import { createApp } from "./app.js";
import { resolve } from "node:path";

const host = "127.0.0.1";
const port = 4310;
const dataRoot = process.env.EGL_DATA_DIR;

createApp(
  dataRoot
    ? {
        entriesDir: resolve(dataRoot, "entries"),
        reviewsDir: resolve(dataRoot, "outputs"),
        databasePath: resolve(dataRoot, "learning.db")
      }
    : undefined
).listen(port, host, () => {
  console.log(`English Growth Lab API: http://${host}:${port}`);
});
