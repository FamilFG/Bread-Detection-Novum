export default function CameraViewport({
  mode,
  videoRef,
  canvasRef,
  snapshot,
  lastCount,
}) {
  return (
    <div className="camera-viewport">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ── Idle state ── */}
      {mode === "idle" && (
        <div className="camera-idle">
          <div className="camera-idle-icon">🎥</div>
          <div>Camera inactive</div>
          <div className="camera-idle-hint">
            Press Start Monitoring to begin
          </div>
        </div>
      )}

      {/* ── Live feed ── */}
      {mode === "live" && (
        <>
          <video
            ref={videoRef}
            className="camera-video"
            muted
            playsInline
            autoPlay
          />
          <div className="camera-overlay-gradient" />
          <div className="scan-line" />
          <div className="corner corner-tl" />
          <div className="corner corner-tr" />
          <div className="corner corner-bl" />
          <div className="corner corner-br" />
        </>
      )}

      {/* ── Snapshot preview ── */}
      {mode === "snapshot" && snapshot && (
        <>
          <img
            src={snapshot}
            alt="Captured frame"
            className="camera-snapshot"
          />
          <div className="corner corner-tl" />
          <div className="corner corner-tr" />
          <div className="corner corner-bl" />
          <div className="corner corner-br" />
          {lastCount !== null && (
            <div className="camera-result-badge">
              🍞 {lastCount} loaves detected
            </div>
          )}
        </>
      )}
    </div>
  );
}