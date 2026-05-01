export function heatStyle(count, max) {
  if (!count || !max) return { opacity: 0, color: "#4f8ef7" };
  const r = count / max;
  if (r > 0.8) return { opacity: 0.16, color: "#f5a623" }; // accent / high
  if (r > 0.6) return { opacity: 0.13, color: "#36d399" }; // green  / good
  if (r > 0.4) return { opacity: 0.1, color: "#4f8ef7" }; // blue   / avg
  return { opacity: 0.07, color: "#a78bfa" }; // purple / low
}

export default function CalDay({ day, count, isToday, isFuture, maxCount }) {
  if (!day) return <div className="cal-day empty" />;

  const { opacity, color } = heatStyle(count, maxCount);
  const barPct = count && maxCount ? Math.round((count / maxCount) * 100) : 0;

  return (
    <div
      className={`cal-day${isToday ? " today" : ""}${isFuture ? " future" : ""}`}
      title={
        isFuture
          ? `${day} — upcoming`
          : count != null
            ? `${day} — ${count.toLocaleString()} loaves`
            : `${day} — no data`
      }
    >
      {/* Solid tint overlay */}
      <div className="cal-heat" style={{ background: color, opacity }} />

      <span className="cal-day-num">{day}</span>

      {count != null ? (
        <span className="cal-day-count" style={{ color }}>
          {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      ) : (
        <span className="cal-day-count no-data">–</span>
      )}

      <div className="cal-bar-wrap">
        <div
          className="cal-bar"
          style={{ width: `${barPct}%`, background: color }}
        />
      </div>
    </div>
  );
}
