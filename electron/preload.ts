import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

/**
 * 预加载脚本 - 暴露安全的 API 给渲染进程
 */

// 定义暴露给渲染进程的 API
const electronAPI = {
  /**
   * 选择文件
   */
  selectFile: (options?: { multiple?: boolean }) => ipcRenderer.invoke('select-file', options),

  /**
   * 保存文件对话框
   */
  saveFile: (defaultName: string) => ipcRenderer.invoke('save-file', defaultName),

  /**
   * 监听文件选择事件
   */
  onFileSelected: (callback: (data: { type: string; path: string }) => void) => {
    const handler = (_event: IpcRendererEvent, data: { type: string; path: string }) => {
      callback(data)
    }
    ipcRenderer.on('file-selected', handler)
    return () => ipcRenderer.removeListener('file-selected', handler)
  },

  /**
   * 监听多文件选择事件
   */
  onFilesSelected: (callback: (data: { type: string; paths: string[] }) => void) => {
    const handler = (_event: IpcRendererEvent, data: { type: string; paths: string[] }) => {
      callback(data)
    }
    ipcRenderer.on('files-selected', handler)
    return () => ipcRenderer.removeListener('files-selected', handler)
  },

  /**
   * 获取平台信息
   */
  platform: process.platform,

  /**
   * 判断是否在 Electron 中运行
   */
  isElectron: true,
}

// 通过 contextBridge 暴露 API
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 类型定义
export type ElectronAPI = typeof electronAPI
