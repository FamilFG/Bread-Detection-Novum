import { useState, useCallback, useEffect } from "react";
import "./index.css";

import { getSummaryStats, captureLog as initialLog } from "./mockData";

import CameraCapture from "./components/CameraCapture/CameraCapture";
import StatCard from "./components/StatCard/StatCard";
import CalendarDashboard from "./components/CalendarDashboard/CalendarDashboard";
import CaptureLog from "./components/CaptureLog/CaptureLog";
import ExitModal from "./components/ExitModal/ExitModal";

const NOW = new Date();

export default function App() {
  const [stats, setStats] = useState({
    today: { value: 0, trend: "...", trendUp: true },
    yesterday: { value: 0, trend: "...", trendUp: true },
    thisWeek: { value: 0, trend: "...", trendUp: true },
    thisMonth: { value: 0, trend: "...", trendUp: true },
  });
  const [log, setLog] = useState(initialLog);
  const [calYear, setCalYear] = useState(NOW.getFullYear());
  const [calMonth, setCalMonth] = useState(NOW.getMonth());
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  useEffect(() => {
    getSummaryStats()
      .then((data) => {
        // Defensive check: if data is already in correct format, use it.
        // If it's the old format (simple numbers), wrap them.
        const normalized = {};
        for (const key of ["today", "yesterday", "thisWeek", "thisMonth"]) {
          if (
            data[key] &&
            typeof data[key] === "object" &&
            "value" in data[key]
          ) {
            normalized[key] = data[key];
          } else {
            normalized[key] = {
              value: data[key] || 0,
              trend: "...",
              trendUp: true,
            };
          }
        }
        setStats(normalized);
      })
      .catch(console.error);

    if (window.electron && window.electron.onExitRequested) {
      window.electron.onExitRequested(() => {
        setShowExitPrompt(true);
      });
    }
  }, []);

  const handleCapture = useCallback(({ time, count }) => {
    setLog((prev) => [{ id: Date.now(), time, count }, ...prev].slice(0, 20));
    setStats((prev) => ({
      ...prev,
      today: { ...prev.today, value: prev.today.value + count },
    }));
  }, []);

  const handleMonthChange = useCallback((y, m) => {
    setCalYear(y);
    setCalMonth(m);
  }, []);

  return (
    <div className="app-shell">
      <header className="header">
        <span className="header-logo">🍞</span>
        <span className="header-title">Novum AI</span>
        <span className="header-server-badge">
          <span className="server-dot" /> SERVER CONNECTED
        </span>
        <span className="header-date">
          {NOW.toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </header>

      <div className="main-content">
        <aside className="left-panel">
          <CameraCapture onCapture={handleCapture} />
          <CaptureLog entries={log} />
        </aside>

        <main className="right-panel">
          <div className="stats-grid">
            <StatCard
              variant="today"
              icon="☀️"
              label="Today"
              value={stats.today.value}
              trend={stats.today.trend}
              trendUp={stats.today.trendUp}
            />
            <StatCard
              variant="yesterday"
              icon="📅"
              label="Yesterday"
              value={stats.yesterday.value}
              trend={stats.yesterday.trend}
              trendUp={stats.yesterday.trendUp}
            />
            <StatCard
              variant="weekly"
              icon="📊"
              label="This Week"
              value={stats.thisWeek.value}
              trend={stats.thisWeek.trend}
              trendUp={stats.thisWeek.trendUp}
            />
            <StatCard
              variant="monthly"
              icon="🗓️"
              label="This Month"
              value={stats.thisMonth.value}
              trend={stats.thisMonth.trend}
              trendUp={stats.thisMonth.trendUp}
            />
          </div>

          <CalendarDashboard
            year={calYear}
            month={calMonth}
            onMonthChange={handleMonthChange}
          />
        </main>
      </div>

      <ExitModal
        isOpen={showExitPrompt}
        onClose={() => setShowExitPrompt(false)}
      />
    </div>
  );
}
