import { useState } from "react";

export default function ExitModal({ isOpen, onClose }) {
  const [exitCode, setExitCode] = useState("");

  if (!isOpen) return null;

  const handleExitConfirm = () => {
    if (exitCode === "12345") {
      window.electron.confirmExit();
    } else {
      alert("Incorrect code! Access denied.");
      setExitCode("");
    }
  };

  const handleExitCancel = () => {
    onClose();
    setExitCode("");
  };

  return (
    <div className="exit-modal-overlay">
      <div className="exit-modal">
        <span className="exit-modal-icon">🔒</span>
        <h2>Security Verification</h2>
        <p>Please enter 12345 to exit the application.</p>

        <div className="exit-code-container">
          <input
            type="password"
            className="exit-code-input"
            placeholder="•••••"
            value={exitCode}
            onChange={(e) => setExitCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExitConfirm()}
            autoFocus
          />
        </div>

        <div className="exit-modal-actions">
          <button
            className="exit-btn exit-btn-cancel"
            onClick={handleExitCancel}
          >
            Cancel
          </button>
          <button
            className="exit-btn exit-btn-confirm"
            onClick={handleExitConfirm}
          >
            Confirm Exit
          </button>
        </div>
      </div>
    </div>
  );
}
