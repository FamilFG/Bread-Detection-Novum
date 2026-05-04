import { useState, useRef, useCallback, useEffect } from "react";

const STREAM_URL = "http://localhost:5000/video_feed";

export default function useCamera({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const streamRef = useRef(null);

  const [mode, setMode] = useState("idle"); // "idle" | "live" | "snapshot"
  const [snapshot, setSnapshot] = useState(null);
  const [lastCount, setLastCount] = useState(null);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks?.().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (imgRef.current) {
      imgRef.current.src = "";
    }
  }, []);

  const startCamera = useCallback(
    async (forcedDeviceId) => {
      setError(null);
      setConnectionStatus("connecting");
      stopStream();

      // Подключение к HTTP-потоку Flask (MJPEG)
      try {
        console.log("[Camera] Connecting to RTSP stream via HTTP...");
        
        // Создаём img элемент для MJPEG-потока и сразу устанавливаем src
        if (imgRef.current) {
          imgRef.current.onerror = () => {
            setError("Failed to connect to RTSP stream. Make sure final_detect_live.py is running on port 5000");
            setConnectionStatus("error");
            console.error("[Camera] Stream error");
          };
          
          // Устанавливаем источник - браузер сам попробует подключиться
          imgRef.current.src = STREAM_URL + "?" + Date.now(); // Кеш-буст
          
          // Даём время для инициализации
          setConnectionStatus("connected");
          console.log("[Camera] MJPEG stream URL set, attempting connection...");
        }

        setSnapshot(null);
        setLastCount(null);
        setMode("live");
      } catch (err) {
        console.error("[Camera] Connection error:", err);
        setError(`Error: ${err.message}`);
        setConnectionStatus("error");
      }
    },
    [stopStream],
  );

  const capture = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    canvas.width = img.width || 640;
    canvas.height = img.height || 480;
    try {
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
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
    } catch (e) {
      console.error("[Capture] Error:", e);
      setError("Cannot capture frame from MJPEG stream");
    }
  }, [onCapture]);

  const runDetection = useCallback(() => {
    setMode("live");
    startCamera();
  }, [startCamera]);

  // Инициализация: загрузить список устройств и начать трансляцию
  useEffect(() => {
    (async () => {
      try {
        // Загружаем список устройств (для совместимости, но не используем для RTSP)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (e) {
        console.error("[Devices] Error:", e);
      }
    })();

    return () => stopStream();
  }, [stopStream]);

  return {
    videoRef,
    canvasRef,
    imgRef,
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
    runDetection,
    capture,
    connectionStatus,
  };
}
