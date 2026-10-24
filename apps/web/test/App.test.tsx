import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App", () => {
  it("opens the commute study shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "English Growth Lab" })).toBeInTheDocument();
    expect(screen.getByText("每天四段：早听、午读、晚听、回家跟读。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "本周" })).toBeInTheDocument();
  });
});
