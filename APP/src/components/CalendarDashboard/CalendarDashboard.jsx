import { useState, useEffect } from "react";
import "./CalendarDashboard.css";
import { MONTH_NAMES, getMonthDays } from "../../mockData";
import CalDay from "./CalDay";
import { handleDownloadPDF } from "./pdfGenerator";

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarDashboard({ year, month, onMonthChange }) {
  const today = new Date();
  const minYear = 2025;
  const maxYear = today.getFullYear();
  const maxMonth = today.getMonth();

  const isMin = year === minYear && month === 0;
  const isMax = year === maxYear && month === maxMonth;

  const [days, setDays] = useState([]);
  const [firstDow, setFirstDow] = useState(0);

  useEffect(() => {
    getMonthDays(year, month).then(({ days, firstDow }) => {
      setDays(days);
      setFirstDow(firstDow);
    }).catch(console.error);
  }, [year, month]);

  const counts = days.map((d) => d.count ?? 0).filter(Boolean);
  const maxCount = counts.length ? Math.max(...counts) : 1;
  const total = counts.reduce((a, b) => a + b, 0);
  const avgPerDay = counts.length ? Math.round(total / counts.length) : 0;
  const bestDay = days.find((d) => d.count === maxCount);
  const gridItems = [...Array(firstDow).fill(null), ...days];

  function navigate(delta) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    onMonthChange(y, m);
  }

  function goToday() {
    onMonthChange(today.getFullYear(), today.getMonth());
  }

  const onDownloadReport = () => {
    handleDownloadPDF({ month, year, monthName: MONTH_NAMES[month], total, avgPerDay, counts, bestDay, maxCount, days });
  };

  return (
    <section className="calendar-section">
      <div className="calendar-header">
        <h2 className="calendar-title">📆 Daily Overview</h2>
        <div className="month-picker">
          <button className="month-nav-btn" onClick={() => navigate(-1)} disabled={isMin}>‹</button>
          <span className="month-label">{MONTH_NAMES[month]} {year}</span>
          <button className="month-nav-btn" onClick={() => navigate(1)} disabled={isMax}>›</button>
          {!(year === today.getFullYear() && month === today.getMonth()) && (
            <button className="month-today-btn" onClick={goToday}>Today</button>
          )}
          <button className="month-today-btn" style={{ marginLeft: 8, background: "var(--primary)", color: "white" }} onClick={onDownloadReport}>
            📥 Export PDF
          </button>
        </div>
        <div className="calendar-legend">
          {[{ label: "High", color: "#f5a623" }, { label: "Good", color: "#36d399" }, { label: "Avg", color: "#4f8ef7" }, { label: "Low", color: "#a78bfa" }].map(({ label, color }) => (
            <span key={label} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />{label}
            </span>
          ))}
        </div>
      </div>

      <div className="cal-dow">
        {DOW_LABELS.map((d) => <div key={d} className="dow-label">{d}</div>)}
      </div>

      <div className="cal-grid">
        {gridItems.map((item, idx) => {
          if (!item) return <div key={`e-${idx}`} className="cal-day empty" />;
          return <CalDay key={item.day} day={item.day} count={item.count} isToday={item.isToday} isFuture={item.isFuture} maxCount={maxCount} />;
        })}
      </div>

      <div className="calendar-footer">
        <div className="cal-footer-stat">Days tracked: <strong>{counts.length}</strong></div>
        <div className="cal-footer-stat">Month total: <strong>{total.toLocaleString()}</strong></div>
        <div className="cal-footer-stat">Daily avg: <strong>{avgPerDay.toLocaleString()}</strong></div>
        {bestDay && (
          <div className="cal-footer-stat">
            Best day: <strong>{MONTH_NAMES[month].slice(0, 3)} {bestDay.day} ({maxCount.toLocaleString()} loaves)</strong>
          </div>
        )}
      </div>
    </section>
  );
}