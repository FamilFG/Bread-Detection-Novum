import { useState } from "react";
import "./CameraCapture.css";
import useCamera from "./useCamera";

/**
 * CameraCapture - Unified Control Center for bread detection
 */
export default function CameraCapture({ onCapture }) {
  const {
    mode,
    cameraConfig,
    updateCameraField,
    activeConfig,
    error,
    runDetection,
    stopDetection,
  } = useCamera({ onCapture });

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleTerminate = () => {
    stopDetection();
    setShowConfirmModal(false);
  };

  return (
    <div className="camera-card">
      <div className="camera-card-header">
        <div className="header-info">
          <span className="section-label">🎬 Analysis Control</span>
          <h3>System Configuration</h3>
        </div>
        {mode === "active" && (
          <span className="live-badge">
            <span className="live-dot" /> ACTIVE
          </span>
        )}
      </div>

      <div className="camera-content">
        {mode === "idle" && (
          <div className="setup-space">
            <p className="setup-hint">Enter camera credentials</p>

            <div className="camera-input-group">
              <div className="input-header">
                <label htmlFor="camera-username">Username</label>
              </div>
              <input
                id="camera-username"
                type="text"
                placeholder="e.g. admin"
                value={cameraConfig.username}
                onChange={(e) => updateCameraField("username", e.target.value)}
                className="camera-source-input"
                autoComplete="username"
              />
            </div>

            <div className="camera-input-group">
              <div className="input-header">
                <label htmlFor="camera-password">Password</label>
              </div>
              <input
                id="camera-password"
                type="password"
                placeholder="Camera password"
                value={cameraConfig.password}
                onChange={(e) => updateCameraField("password", e.target.value)}
                className="camera-source-input"
                autoComplete="current-password"
              />
            </div>

            <div className="camera-input-group">
              <div className="input-header">
                <label htmlFor="camera-ip">Camera IP</label>
                <span className="input-hint">IPv4 address</span>
              </div>
              <input
                id="camera-ip"
                type="text"
                placeholder="e.g. 192.168.1.64"
                value={cameraConfig.ip}
                onChange={(e) => updateCameraField("ip", e.target.value)}
                className="camera-source-input"
                autoComplete="off"
              />
            </div>

            <div className="status-indicator">
              <span className="status-dot-pulse"></span>
              Ready to Connect
            </div>
          </div>
        )}

        {mode === "active" && (
          <div className="active-space">
            <div className="active-icon-wrapper">
              <div className="radar-circle"></div>
              <span className="active-icon">🚀</span>
            </div>
            <div className="active-text">
              <h2>Detection Active</h2>
              <p className="active-credentials">
                <span>
                  <strong>Username:</strong> {activeConfig?.username ?? "—"}
                </span>
                <span>
                  <strong>Password:</strong> {activeConfig?.password ?? "—"}
                </span>
                <span>
                  <strong>IP:</strong> {activeConfig?.ip ?? "—"}
                </span>
              </p>
            </div>
            <div className="python-badge">
              <span className="python-dot"></span>
              PYTHON RUNNING
            </div>
          </div>
        )}

        {error && <div className="camera-error">⚠️ {error}</div>}
      </div>

      <div className="camera-actions">
        {mode === "idle" ? (
          <button
            className="btn btn-primary"
            onClick={() => runDetection(cameraConfig)}
          >
            <span className="btn-icon">⚡</span> Start Detection
          </button>
        ) : (
          <button
            className="btn btn-danger"
            onClick={() => setShowConfirmModal(true)}
          >
            <span className="btn-icon">⏹</span> Terminate Process
          </button>
        )}
      </div>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-warning-icon">⚠️</span>
              <h3>Confirm Termination</h3>
            </div>
            <p className="modal-text">
              Are you sure you want to stop the detection process? Unsaved
              progress for the current session might be lost.
            </p>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleTerminate}>
                Confirm Termination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
