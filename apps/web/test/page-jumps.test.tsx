import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PageJumps, scrollEdge } from "../src/components/PageJumps";

function setPage(scrollTop: number, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: clientHeight });
  Object.defineProperty(window, "scrollY", { configurable: true, value: scrollTop });
  document.body.style.height = `${scrollHeight}px`;
}

describe("page jumps", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it("stays hidden when the page fits on one screen", () => {
    setPage(0, 700, 800);
    render(
      <MemoryRouter>
        <PageJumps />
      </MemoryRouter>
    );
    expect(screen.queryByRole("button", { name: "顶部" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "底部" })).not.toBeInTheDocument();
  });

  it("jumps to the top or the bottom of a long page", () => {
    setPage(500, 2400, 800);
    render(
      <MemoryRouter>
        <PageJumps />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "顶部" }));
    fireEvent.click(screen.getByRole("button", { name: "底部" }));

    expect(window.scrollTo).toHaveBeenNthCalledWith(1, { top: 0, behavior: "smooth" });
    expect(window.scrollTo).toHaveBeenNthCalledWith(2, { top: 2400, behavior: "smooth" });
  });

  it("disables the jump that is already at that end", () => {
    expect(scrollEdge(0, 2400, 800)).toBe("top");
    expect(scrollEdge(1600, 2400, 800)).toBe("bottom");
    expect(scrollEdge(400, 2400, 800)).toBe("middle");

    setPage(0, 2400, 800);
    render(
      <MemoryRouter>
        <PageJumps />
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: "顶部" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "底部" })).toBeEnabled();
  });
});
