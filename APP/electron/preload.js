const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  checkActivation: () => ipcRenderer.invoke("check-activation"),
  activateApp: (code) => ipcRenderer.invoke("activate-app", code),
  getMonthDays: (year, month) =>
    ipcRenderer.invoke("get-month-days", year, month),
  getSummaryStats: (referenceTime) =>
    ipcRenderer.invoke("get-summary-stats", referenceTime),
  onExitRequested: (callback) => ipcRenderer.on("request-exit", callback),
  getCameraConfig: (partial) =>
    ipcRenderer.invoke("get-camera-config", partial),
  runDetection: (source) => ipcRenderer.invoke("run-detection", source),
  stopDetection: () => ipcRenderer.invoke("stop-detection"),
  confirmExit: () => ipcRenderer.send("confirm-exit"),
});
