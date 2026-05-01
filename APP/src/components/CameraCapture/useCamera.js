import { useState, useRef, useCallback, useEffect } from "react";

export default function useCamera({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [mode, setMode] = useState("idle"); // "idle" | "live" | "snapshot"
  const [snapshot, setSnapshot] = useState(null);
  const [lastCount, setLastCount] = useState(null);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(
    async (forcedDeviceId) => {
      setError(null);
      stopStream();

      const deviceId = forcedDeviceId || selectedDevice;

      const constraints = {
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      try {
        console.log(
          "[Camera] Requesting access with constraints:",
          constraints,
        );
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              .play()
              .catch((e) => console.error("[Camera] Play error:", e));
          };
        }

        setSnapshot(null);
        setLastCount(null);
        setMode("live");
      } catch (err) {
        console.error("[Camera] getUserMedia error:", err);
        setError(
          err.name === "NotAllowedError"
            ? "Camera permission denied. Check Electron permissions."
            : err.name === "NotFoundError"
              ? "No camera found on this device."
              : `Camera error: ${err.message}`,
        );
      }
    },
    [selectedDevice, stopStream],
  );

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setSnapshot(dataUrl);

    const mockCount = Math.floor(Math.random() * 5) + 1;
    setLastCount(mockCount);

    onCapture?.({
      time: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      count: mockCount,
    });
  }, [onCapture]);

  useEffect(() => {
    let mounted = true;
    async function getDevices() {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        tempStream.getTracks().forEach((t) => t.stop());

        const all = await navigator.mediaDevices.enumerateDevices();
        const cameras = all.filter((d) => d.kind === "videoinput");
        if (!mounted) return;

        setDevices(cameras);
        if (cameras.length > 0) {
          const deviceId = cameras[0].deviceId;
          setSelectedDevice(deviceId);

          const checkRef = setInterval(() => {
            if (videoRef.current) {
              clearInterval(checkRef);
              startCamera(deviceId);
            }
          }, 100);
          setTimeout(() => clearInterval(checkRef), 5000);
        }
      } catch (err) {
        if (mounted) setError("Camera access failed: " + err.message);
      }
    }
    getDevices();
    return () => {
      mounted = false;
    };
  }, [startCamera]);

  useEffect(() => {
    if (mode !== "live") return;
    const timer = setInterval(() => {
      capture();
    }, 3000);
    return () => clearInterval(timer);
  }, [mode, capture]);

  return {
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
  };
}
