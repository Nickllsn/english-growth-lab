import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const edgeSlack = 48;

type ScrollEdge = "short" | "top" | "bottom" | "middle";

export function scrollEdge(scrollTop: number, scrollHeight: number, clientHeight: number): ScrollEdge {
  const max = scrollHeight - clientHeight;
  if (max <= edgeSlack) return "short";
  if (scrollTop <= edgeSlack) return "top";
  if (scrollTop >= max - edgeSlack) return "bottom";
  return "middle";
}

function pageMetrics() {
  const scrolling = document.scrollingElement ?? document.documentElement;
  return {
    scrollTop: scrolling.scrollTop || window.scrollY,
    scrollHeight: Math.max(scrolling.scrollHeight, document.body?.scrollHeight ?? 0),
    clientHeight: scrolling.clientHeight || window.innerHeight
  };
}

export function PageJumps() {
  const location = useLocation();
  const [edge, setEdge] = useState<ScrollEdge>("short");

  useEffect(() => {
    const update = () => {
      const metrics = pageMetrics();
      setEdge(scrollEdge(metrics.scrollTop, metrics.scrollHeight, metrics.clientHeight));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    observer?.observe(document.body);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [location.pathname, location.search, location.hash]);

  if (edge === "short") return null;

  const reduceMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = reduceMotion ? "auto" : "smooth";
  const jump = (top: number) => window.scrollTo({ top, behavior });

  return (
    <div className="page-jumps">
      <button type="button" onClick={() => jump(0)} disabled={edge === "top"}>
        顶部
      </button>
      <button
        type="button"
        onClick={() => jump(pageMetrics().scrollHeight)}
        disabled={edge === "bottom"}
      >
        底部
      </button>
    </div>
  );
}
