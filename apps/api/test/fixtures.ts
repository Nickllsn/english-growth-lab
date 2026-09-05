export const validEntry = {
  date: "2026-09-05",
  roadmapDay: 1,
  topic: "Linux Performance",
  material: {
    title: "Finding the bottleneck",
    url: "https://example.com/performance",
    source: "InfoQ"
  },
  readingMinutes: 10,
  listeningMinutes: 10,
  understanding: 3,
  expressions: [
    { text: "the real bottleneck", meaning: "真正的瓶颈", usedInSummary: true },
    { text: "in practice", meaning: "在实践中", usedInSummary: true },
    { text: "at scale", meaning: "大规模场景下", usedInSummary: false }
  ],
  summary:
    "The article explains a bottleneck. In practice, measurement matters. The method works at scale.",
  completedAt: "2026-09-05T08:30:00.000Z"
};
