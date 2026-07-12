// electron/main.cjs — Electron main process. Loads the built Vite app.
// CommonJS because the package is "type":"module" and Electron prefers CJS here.
const { app, BrowserWindow, Menu } = require("electron");
const path = require("node:path");

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 720,
    minHeight: 560,
    title: "Idle Hands",
    autoHideMenuBar: true,
    backgroundColor: "#2a2620",
    webPreferences: {
      devTools: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));

  // Tone.js audio needs a user gesture in any Electron webview; the splash
  // button provides it just like in the browser.
});

app.on("window-all-closed", () => {
  app.quit();
});