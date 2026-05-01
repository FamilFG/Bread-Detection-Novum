import "./CameraCapture.css";
import useCamera from "./useCamera";
import CameraViewport from "./CameraViewport";

/**
 * CameraCapture
 */
export default function CameraCapture({ onCapture }) {
  const {
    videoRef,
    canvasRef,
    mode,
    setMode,
    snapshot,
    lastCount,
    error,
    devices,
    selectedDevice,
    setSelectedDevice,
    startCamera,
    stopStream,
  } = useCamera({ onCapture });

  return (
    <div className="camera-card">
      {/* Header */}
      <div className="camera-card-header">
        <span className="section-label">📷 Camera Feed</span>
        {mode === "live" && (
          <span className="live-badge">
            <span className="live-dot" /> AUTO-MONITORING (3s)
          </span>
        )}
      </div>

      {/* Camera selector (only when idle or multiple cameras) */}
      {devices.length > 1 && mode === "idle" && (
        <div style={{ padding: "0 14px 10px" }}>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            style={{
              width: "100%",
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: "0.78rem",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Viewport */}
      <CameraViewport
        mode={mode}
        videoRef={videoRef}
        canvasRef={canvasRef}
        snapshot={snapshot}
        lastCount={lastCount}
      />

      {/* Error message */}
      {error && <div className="camera-error">⚠️ {error}</div>}

      {/* Action buttons */}
      <div className="camera-actions">
        {mode === "idle" && (
          <button
            className="btn btn-primary"
            onClick={() => startCamera()}
            disabled={devices.length === 0}
          >
            <span className="btn-icon">▶</span> Start Monitoring
          </button>
        )}

        {mode === "live" && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              stopStream();
              setMode("idle");
            }}
          >
            ✕ Stop Monitoring
          </button>
        )}
      </div>
    </div>
  );
}
