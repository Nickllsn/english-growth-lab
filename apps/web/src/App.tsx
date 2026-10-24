import { HashRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { shanghaiToday } from "./content/schedule";
import { ProgressPage } from "./pages/ProgressPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { TodayPage } from "./pages/TodayPage";
import { WeekPage } from "./pages/WeekPage";

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
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
