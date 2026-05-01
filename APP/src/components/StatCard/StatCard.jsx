import { useState, useEffect } from "react";
import "./StatCard.css";

function formatNum(n) {
  return n?.toLocaleString() ?? "–";
}

export default function StatCard({
  variant,
  icon,
  label,
  value,
  trend,
  trendUp,
}) {
  const [displayed, setDisplayed] = useState(0);

  // Animate counter on mount / when value changes
  useEffect(() => {
    let frame;
    const start = 0;
    const end = value;
    const duration = 1000; // ms
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (end - start) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{formatNum(displayed)}</div>
      {trend && (
        <div className="stat-trend">
          {trendUp !== undefined && (
            <span className={trendUp ? "trend-up" : "trend-down"}>
              {trendUp ? "▲" : "▼"}
            </span>
          )}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
