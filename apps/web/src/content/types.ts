export type MaterialFormat = "text" | "audio" | "video";

export interface MaterialLink {
  title: string;
  url: string;
  formats: MaterialFormat[];
  note: string;
}

export interface SlotPlan {
  id: "morning" | "noon" | "evening" | "home" | "preview" | "review";
  minutes: number;
  place: string;
  title: string;
  steps: string[];
  links: MaterialLink[];
}

export interface Chunk {
  text: string;
  meaning: string;
}

export interface StudyDay {
  date: string;
  kind: "study" | "weekend";
  theme: string;
  objective: string;
  slots: SlotPlan[];
  chunks: Chunk[];
  shadow: string[];
  speakPrompt: string;
}

export interface WeekPack {
  id: string;
  title: string;
  phase: string;
  startsOn: string;
  endsOn: string;
  goal: string;
  days: StudyDay[];
}

export interface Phase {
  id: string;
  title: string;
  when: string;
  goal: string;
  materials: string;
}

export interface Curriculum {
  timezone: "Asia/Shanghai";
  audience: string;
  rhythm: string[];
  phases: Phase[];
}
