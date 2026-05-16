const { app, BrowserWindow, ipcMain, session } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
let forceQuit = false;
let currentPythonProcess = null;

// Activation Configuration
// Activation code is "UFAZ2026"
const ACTIVATION_HASH =
  "c2c36d6bcdc0febf0638c019a91a3a5705963cea4cd14734bafbe1609357bacd";
const ACTIVATION_FILE = path.join(app.getPath("userData"), "activation.json");
// Импортируем функции из твоей БД
const { getMonthDays, getSummaryStats } = require("../src/db.js");

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Настройка разрешений
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      const allowed = [
        "media",
        "mediaKeySystem",
        "geolocation",
        "notifications",
      ];
      if (allowed.includes(permission) || permission === "media") {
        return callback(true);
      }
      callback(false);
    },
  );

  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission) => {
      return ["media", "mediaKeySystem"].includes(permission);
    },
  );

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.on("close", (e) => {
    if (!forceQuit) {
      e.preventDefault();
      win.webContents.send("request-exit");
    }
  });
}

// --- РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ IPC ---

// Activation Handlers
ipcMain.handle("check-activation", () => {
  try {
    if (fs.existsSync(ACTIVATION_FILE)) {
      const data = JSON.parse(fs.readFileSync(ACTIVATION_FILE, "utf-8"));
      return data.activated === true;
    }
  } catch (err) {
    console.error("Error checking activation:", err);
  }
  return false;
});

ipcMain.handle("activate-app", (_, code) => {
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  if (hash === ACTIVATION_HASH) {
    try {
      fs.writeFileSync(ACTIVATION_FILE, JSON.stringify({ activated: true }));
      return { success: true };
    } catch (err) {
      console.error("Error saving activation:", err);
      return { success: false, error: "Storage error" };
    }
  }
  return { success: false, error: "Invalid activation code" };
});

// Обработчик платформы (уже был у тебя)
ipcMain.handle("get-platform", () => process.platform);

// Твои новые обработчики для БД
ipcMain.handle("get-month-days", async (_, year, month) => {
  return await getMonthDays(year, month);
});

ipcMain.handle("get-summary-stats", async (_, referenceTime) => {
  return await getSummaryStats(referenceTime);
});

function loadCameraConfig(configPath) {
  const empty = { username: "", password: "", ip: "" };
  if (!fs.existsSync(configPath)) return { ...empty };
  try {
    return { ...empty, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
  } catch (err) {
    console.error("[Main] Failed to read camera_config.json:", err);
    return { ...empty };
  }
}

function mergeCameraConfig(existing, incoming) {
  const merged = { ...existing };
  if (incoming?.username?.trim()) merged.username = incoming.username.trim();
  if (incoming?.password) merged.password = incoming.password;
  if (incoming?.ip?.trim()) merged.ip = incoming.ip.trim();
  return merged;
}

const cameraConfigPath = () =>
  path.join(__dirname, "../../camera_config.json");

const stopFlagPath = () =>
  path.join(__dirname, "../../stop_detection.flag");

function clearStopFlag() {
  try {
    if (fs.existsSync(stopFlagPath())) {
      fs.unlinkSync(stopFlagPath());
    }
  } catch (err) {
    console.error("[Main] Failed to clear stop flag:", err);
  }
}

ipcMain.handle("get-camera-config", (_, partial) => {
  return mergeCameraConfig(loadCameraConfig(cameraConfigPath()), partial || {});
});

ipcMain.handle("run-detection", async (_, config) => {
  return new Promise((resolve, reject) => {
    const configPath = cameraConfigPath();

    try {
      const payload = mergeCameraConfig(loadCameraConfig(configPath), config);
      if (!payload.username || !payload.password || !payload.ip) {
        reject(
          new Error(
            "No camera credentials found. Fill the fields or add them to camera_config.json.",
          ),
        );
        return;
      }
      fs.writeFileSync(configPath, JSON.stringify(payload, null, 2));
      console.log(
        `[Main] Using camera config for ${payload.username}@${payload.ip}`,
      );
    } catch (err) {
      console.error("[Main] Failed to update camera_config.json:", err);
      reject(err);
      return;
    }

    clearStopFlag();

    const scriptPath = path.join(__dirname, "../../optimized_live_detection.py");
    currentPythonProcess = spawn("python", [scriptPath], {
      cwd: path.join(__dirname, "../../"),
    });

    currentPythonProcess.stdout.on("data", (data) => {
      console.log(`[Python] ${data}`);
    });

    currentPythonProcess.stderr.on("data", (data) => {
      console.error(`[Python Error] ${data}`);
    });

    currentPythonProcess.on("close", (code) => {
      console.log(`[Python] Process exited with code ${code}`);
      currentPythonProcess = null;
      resolve(code);
    });

    currentPythonProcess.on("error", (err) => {
      console.error(`[Python] Failed to start: ${err}`);
      currentPythonProcess = null;
      reject(err);
    });
  });
});

ipcMain.handle("stop-detection", () => {
  return new Promise((resolve) => {
    if (!currentPythonProcess) {
      resolve(false);
      return;
    }

    const proc = currentPythonProcess;
    console.log("[Main] Requesting graceful stop (save + exit)...");

    try {
      fs.writeFileSync(stopFlagPath(), "1");
    } catch (err) {
      console.error("[Main] Failed to write stop flag:", err);
    }

    const forceKillMs = 15000;
    const timeout = setTimeout(() => {
      if (currentPythonProcess === proc) {
        console.log("[Main] Force killing Python after timeout");
        proc.kill();
        currentPythonProcess = null;
      }
      clearStopFlag();
      resolve(true);
    }, forceKillMs);

    proc.once("close", (code) => {
      clearTimeout(timeout);
      if (currentPythonProcess === proc) {
        currentPythonProcess = null;
      }
      clearStopFlag();
      console.log(`[Main] Python exited with code ${code}`);
      resolve(true);
    });
  });
});

ipcMain.on("confirm-exit", () => {
  forceQuit = true;
  app.quit();
});

// ------------------------------------

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
