import { useState, useCallback, useEffect } from "react";
import "./index.css";

import { getSummaryStats, captureLog as initialLog } from "./mockData"; // ← убрал summaryStats

import CameraCapture from "./components/CameraCapture/CameraCapture";
import StatCard from "./components/StatCard/StatCard";
import CalendarDashboard from "./components/CalendarDashboard/CalendarDashboard";
import CaptureLog from "./components/CaptureLog/CaptureLog";

const NOW = new Date();

export default function App() {
  const [stats, setStats] = useState({ today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0 });
  const [log, setLog] = useState(initialLog);
  const [calYear, setCalYear] = useState(NOW.getFullYear());
  const [calMonth, setCalMonth] = useState(NOW.getMonth());

  useEffect(() => {
    getSummaryStats().then(setStats).catch(console.error);
  }, []);

  const handleCapture = useCallback(({ time, count }) => {
    setLog((prev) => [{ id: Date.now(), time, count }, ...prev].slice(0, 20));
    setStats((prev) => ({ ...prev, today: prev.today + count }));
  }, []);

  const handleMonthChange = useCallback((y, m) => {
    setCalYear(y);
    setCalMonth(m);
  }, []);

  return (
    <div className="app-shell">
      <header className="header">
        <span className="header-logo">🍞</span>
        <span className="header-title">BreadTrack AI</span>
        <span className="header-server-badge">
          <span className="server-dot" /> SERVER CONNECTED
        </span>
        <span className="header-date">
          {NOW.toLocaleDateString("en-GB", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
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
            <StatCard variant="today" icon="☀️" label="Today" value={stats.today} trend="vs yesterday" trendUp={false} />
            <StatCard variant="yesterday" icon="📅" label="Yesterday" value={stats.yesterday} trend="vs 2 days ago" trendUp={true} />
            <StatCard variant="weekly" icon="📊" label="This Week" value={stats.thisWeek} trend="vs last week" trendUp={true} />
            <StatCard variant="monthly" icon="🗓️" label="This Month" value={stats.thisMonth} trend="days tracked" />
          </div>

          <CalendarDashboard year={calYear} month={calMonth} onMonthChange={handleMonthChange} />
        </main>
      </div>
    </div>
  );
}