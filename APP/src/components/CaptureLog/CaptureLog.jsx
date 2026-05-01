import "./CaptureLog.css";

export default function CaptureLog({ entries }) {
  return (
    <div className="capture-log">
      <div
        className="section-label"
        style={{ display: "flex", alignItems: "center" }}
      >
        📋 Recent Captures
        <span className="log-count-badge">{entries.length}</span>
      </div>

      {entries.length === 0 ? (
        <p className="log-empty">No captures yet — use the camera above.</p>
      ) : (
        <ul className="log-list">
          {entries.slice(0, 8).map((item) => (
            <li key={item.id} className="log-item">
              <span className="log-time">{item.time}</span>
              <span className="log-icon">🍞</span>
              <span className="log-label">Batch captured</span>
              <span className="log-count">+{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
