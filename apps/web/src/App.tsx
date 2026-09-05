import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { TodayPage } from "./pages/TodayPage";

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/progress" element={<p>进度页面准备中</p>} />
          <Route path="/outputs" element={<p>输出页面准备中</p>} />
          <Route path="/roadmap" element={<p>路线页面准备中</p>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
