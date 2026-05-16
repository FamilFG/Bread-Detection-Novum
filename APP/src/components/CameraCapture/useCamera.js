import { useState, useCallback } from "react";

/**
 * useCamera - Controller for the detection logic
 * Now purely handles IPC communication with the Python backend
 */
const defaultCameraConfig = {
  username: "",
  password: "",
  ip: "",
};

export default function useCamera({ onCapture }) {
  const [mode, setMode] = useState("idle"); // "idle" | "active"
  const [error, setError] = useState(null);
  const [cameraConfig, setCameraConfig] = useState(defaultCameraConfig);
  const [activeConfig, setActiveConfig] = useState(null);

  const runDetection = useCallback(async (config) => {
    const { username, password, ip } = config;
    const partial = {
      username: username.trim(),
      password: password,
      ip: ip.trim(),
    };

    setError(null);
    try {
      const resolved = await window.electron.getCameraConfig(partial);
      setActiveConfig({
        username: resolved.username,
        password: resolved.password,
        ip: resolved.ip,
      });
      setMode("active");
      console.log(
        "[Detection] Starting Python script for",
        `${resolved.username}@${resolved.ip}`,
      );
      await window.electron.runDetection(partial);
    } catch (err) {
      console.error("[Detection] Error:", err);
      setError("Detection failed: " + err.message);
    } finally {
      setMode("idle");
      setActiveConfig(null);
    }
  }, []);

  const stopDetection = useCallback(async () => {
    try {
      console.log("[Detection] Stopping Python script (save + exit)...");
      await window.electron.stopDetection();
    } catch (err) {
      console.error("[Detection] Stop Error:", err);
      setError("Failed to stop detection: " + err.message);
    } finally {
      setMode("idle");
      setActiveConfig(null);
    }
  }, []);

  const updateCameraField = useCallback((field, value) => {
    setCameraConfig((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
    mode,
    setMode,
    cameraConfig,
    updateCameraField,
    activeConfig,
    error,
    runDetection,
    stopDetection,
  };
}
