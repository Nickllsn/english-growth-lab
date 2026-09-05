import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App", () => {
  it("introduces the daily learning lab", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "English Growth Lab" })
    ).toBeInTheDocument();
    expect(screen.getByText("每天阅读、倾听、表达，留下看得见的进步。")).toBeInTheDocument();
  });
});
