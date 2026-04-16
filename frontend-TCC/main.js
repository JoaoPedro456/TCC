const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadURL('http://localhost:3000') // em dev
  // Em produção: win.loadFile('build/index.html')
}

app.whenReady().then(createWindow)