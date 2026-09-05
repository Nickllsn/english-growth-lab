export interface RoadmapDay {
  day: number;
  week: number;
  theme: string;
  source: { name: string; url: string; difficulty: number };
  focus: string;
  suggestedMinutes: {
    reading: number;
    listening: number;
    output: number;
  };
}

export interface Expression {
  text: string;
  meaning: string;
  usedInSummary: boolean;
}

export interface DailyEntry {
  date: string;
  roadmapDay: number;
  topic: string;
  material: { title: string; url: string; source: string };
  readingMinutes: number;
  listeningMinutes: number;
  understanding: number;
  expressions: Expression[];
  summary: string;
  completedAt?: string;
}

export interface ProgressStats {
  currentStreak: number;
  longestStreak: number;
  completedDays: number;
  completionRate: number;
  readingMinutes: number;
  listeningMinutes: number;
  totalMinutes: number;
  englishWordCount: number;
  expressionCount: number;
  reusedExpressionCount: number;
  weeklyUnderstanding: Array<{ week: string; average: number }>;
}

export interface StoredReview {
  week: string;
  theme: string;
  markdown: string;
}

export interface WeeklyReviewInput {
  week: string;
  theme: string;
  materials: Array<{ title: string; url: string }>;
  technicalPerspective: string;
  businessPerspective: string;
  myView: string;
  reusedExpressions: string[];
  nextWeek: string;
}

interface ErrorBody {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly fields: Record<string, string[]> = {}
  ) {
    super(message);
  }
}

async function requestJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorBody;
    throw new ApiError(
      body.error?.message ?? "请求失败",
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.fields
    );
  }
  return response.json() as Promise<T>;
}

export async function getRoadmap(): Promise<RoadmapDay[]> {
  return (await requestJson<{ days: RoadmapDay[] }>("/api/roadmap")).days;
}

export async function getEntries(): Promise<DailyEntry[]> {
  return (await requestJson<{ entries: DailyEntry[] }>("/api/entries")).entries;
}

export async function getEntry(date: string): Promise<DailyEntry | null> {
  try {
    return await requestJson<DailyEntry>(`/api/entries/${date}`);
  } catch (error) {
    if (error instanceof ApiError && error.code === "ENTRY_NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

export function saveEntry(
  date: string,
  entry: DailyEntry
): Promise<DailyEntry> {
  return requestJson(`/api/entries/${date}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry)
  });
}

export function getProgress(): Promise<ProgressStats> {
  return requestJson("/api/progress");
}

export async function getReviews(): Promise<StoredReview[]> {
  return (await requestJson<{ reviews: StoredReview[] }>("/api/reviews")).reviews;
}

export function saveReview(
  week: string,
  review: WeeklyReviewInput
): Promise<StoredReview> {
  return requestJson(`/api/reviews/${week}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review)
  });
}
