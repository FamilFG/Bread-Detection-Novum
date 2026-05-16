import { useState, useRef, useEffect } from "react";
import "./ExitModal.css";

export default function ExitModal({ isOpen, onClose }) {
  const [exitCode, setExitCode] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setExitCode("");
      setError(false);
      setShake(false);
    }
  }, [isOpen]);

  const handleExitConfirm = () => {
    if (exitCode === "12345") {
      window.electron.confirmExit();
    } else {
      setError(true);
      setShake(true);
      setExitCode("");

      // Focus back instantly
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);

      // Reset shake after animation finishes
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleInputChange = (e) => {
    setExitCode(e.target.value);
    if (error) setError(false);
  };

  const handleExitCancel = () => {
    onClose();
    setExitCode("");
    setError(false);
  };

  if (!isOpen) return null;

  return (
    <div className="exit-modal-overlay">
      <div className={`exit-modal ${shake ? "shake" : ""}`}>
        <span className="exit-modal-icon">🔒</span>
        <h2>Security Verification</h2>
        <p>Please enter 12345 code to exit.</p>

        <div className="exit-code-container">
          <input
            ref={inputRef}
            type="password"
            className={`exit-code-input ${error ? "error" : ""}`}
            placeholder="•••••"
            value={exitCode}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleExitConfirm()}
          />
        </div>

        <div className={`exit-modal-error ${error ? "visible" : ""}`}>
          Incorrect code! Please try again.
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
            disabled={!exitCode}
          >
            Confirm Exit
          </button>
        </div>
      </div>
    </div>
  );
}
