import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { shanghaiToday } from "./content/schedule";
import { ProgressPage } from "./pages/ProgressPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { TodayPage } from "./pages/TodayPage";
import { VocabPage } from "./pages/VocabPage";
import { WeekPage } from "./pages/WeekPage";

const ListenPage = lazy(() =>
  import("./pages/ListenPage").then((module) => ({ default: module.ListenPage }))
);

function RoutedToday() {
  const [params] = useSearchParams();
  return <TodayPage today={params.get("today") ?? shanghaiToday()} />;
}

function RoutedWeek() {
  const [params] = useSearchParams();
  return <WeekPage today={params.get("today") ?? shanghaiToday()} />;
}

export function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<RoutedToday />} />
          <Route path="/week" element={<RoutedWeek />} />
          <Route path="/vocab" element={<VocabPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route
            path="/listen"
            element={
              <Suspense fallback={<p className="listen-note">正在打开文字稿</p>}>
                <ListenPage />
              </Suspense>
            }
          />
          <Route
            path="/listen/:episodeId"
            element={
              <Suspense fallback={<p className="listen-note">正在打开文字稿</p>}>
                <ListenPage />
              </Suspense>
            }
          />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
