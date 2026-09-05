import { createApp } from "./app.js";

const host = "127.0.0.1";
const port = 4310;

createApp().listen(port, host, () => {
  console.log(`English Growth Lab API: http://${host}:${port}`);
});
