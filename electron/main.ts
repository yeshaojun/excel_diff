import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'

let mainWindow: BrowserWindow | null = null
let serverProcess: ChildProcess | null = null
const PORT = 3000

/**
 * 启动内置 Express 服务器
 */
function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    // __dirname is dist/electron, server.js is in dist/
    const serverPath = join(__dirname, '../server.js')

    serverProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: String(PORT), ELECTRON_RUN: 'true' },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    serverProcess.stdout?.on('data', data => {
      console.log(`[Server] ${data.toString()}`)
      if (data.toString().includes('Server running')) {
        resolve()
      }
    })

    serverProcess.stderr?.on('data', data => {
      console.error(`[Server Error] ${data.toString()}`)
    })

    serverProcess.on('error', err => {
      console.error('Failed to start server:', err)
      reject(err)
    })

    // 超时保护
    setTimeout(() => resolve(), 3000)
  })
}

/**
 * 停止服务器
 */
function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
}

/**
 * 创建主窗口
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Excel 文件对比工具',
    icon: join(__dirname, '../../public/icon-64.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    show: false, // 先隐藏，加载完成后显示
  })

  // 加载应用
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

  if (isDev) {
    mainWindow.loadURL(`http://localhost:${PORT}`)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL(`http://localhost:${PORT}`)
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * 创建应用菜单
 */
function createMenu(): void {
  const template: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '选择基准文件',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              title: '选择基准 Excel 文件',
              filters: [
                { name: 'Excel 文件', extensions: ['xlsx', 'xls'] },
                { name: '所有文件', extensions: ['*'] },
              ],
              properties: ['openFile'],
            })
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('file-selected', {
                type: 'base',
                path: result.filePaths[0],
              })
            }
          },
        },
        {
          label: '选择对比文件',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              title: '选择对比 Excel 文件',
              filters: [
                { name: 'Excel 文件', extensions: ['xlsx', 'xls'] },
                { name: '所有文件', extensions: ['*'] },
              ],
              properties: ['openFile', 'multiSelections'],
            })
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('files-selected', {
                type: 'targets',
                paths: result.filePaths,
              })
            }
          },
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit',
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于 Excel 文件对比工具',
              message: 'Excel 文件对比工具 v1.0.0',
              detail:
                '专业的 Excel 文件对比工具，支持单元格级别的变更检测。\n\n功能特点：\n• 多工作表对比\n• 新增/修改/删除检测\n• 多种输出格式\n• 带标记的 Excel 导出',
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// IPC 处理
ipcMain.handle('select-file', async (_event, options: { multiple?: boolean }) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '选择 Excel 文件',
    filters: [
      { name: 'Excel 文件', extensions: ['xlsx', 'xls'] },
      { name: '所有文件', extensions: ['*'] },
    ],
    properties: options.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
  })
  return result.canceled ? null : result.filePaths
})

ipcMain.handle('save-file', async (_event, defaultName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: '保存文件',
    defaultPath: defaultName,
    filters: [
      { name: 'Excel 文件', extensions: ['xlsx'] },
      { name: '文本文件', extensions: ['txt', 'md', 'csv', 'json'] },
    ],
  })
  return result.canceled ? null : result.filePath
})

// 应用生命周期
app.whenReady().then(async () => {
  try {
    await startServer()
    createMenu()
    createWindow()
  } catch (error) {
    console.error('Failed to start application:', error)
    app.quit()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopServer()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopServer()
})

// 处理未捕获的异常
process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error)
  dialog.showErrorBox('错误', `发生未知错误: ${error.message}`)
})
