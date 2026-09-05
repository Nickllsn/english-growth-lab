import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { OutputsPage } from "./pages/OutputsPage";
import { ProgressPage } from "./pages/ProgressPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { TodayPage } from "./pages/TodayPage";

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/outputs" element={<OutputsPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
