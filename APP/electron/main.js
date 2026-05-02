const { app, BrowserWindow, ipcMain, session } = require("electron");
let forceQuit = false;

const path = require("path");
// Импортируем функции из твоей БД
const {
  getMonthDays,
  getSummaryStats,
} = require("C:/Users/User/Desktop/Novum/novum-app-main/src/db");

const isDev = true;

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

// Обработчик платформы (уже был у тебя)
ipcMain.handle("get-platform", () => process.platform);

// Твои новые обработчики для БД
ipcMain.handle("get-month-days", async (_, year, month) => {
  return await getMonthDays(year, month);
});

ipcMain.handle("get-summary-stats", async () => {
  return await getSummaryStats();
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
