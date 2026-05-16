import { useState } from "react";
import "./ActivationScreen.css";

export default function ActivationScreen({ onActivate }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const result = await window.electron.activateApp(code);
      if (result.success) {
        onActivate();
      } else {
        setError(result.error || "Invalid activation code");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activation-overlay">
      <div className="activation-card">
        <div className="activation-header">
          <div className="activation-icon">🛡️</div>
          <h2>Product Activation</h2>
          <p>Please enter your activation code to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="activation-form">
          <div className="input-group">
            <input
              type="password"
              placeholder="••••••••••••"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              disabled={loading}
              className={error ? "input-error" : ""}
              autoFocus
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <button type="submit" disabled={loading || !code.trim()} className="activate-button">
            {loading ? "Validating..." : "Activate Software"}
          </button>
        </form>

        <div className="activation-footer">
          <p>Locked by Novum AI Security System</p>
        </div>
      </div>
    </div>
  );
}
