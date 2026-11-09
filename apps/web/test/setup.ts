import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { resetPlaybackForTests } from "../src/playback/engine";

afterEach(() => {
  cleanup();
  resetPlaybackForTests();
});
