/**
 * 全局配置文件 - 中文消息配置
 * Global Configuration - Chinese Messages
 */

export interface Messages {
  // Error messages - 错误消息
  errors: {
    baseFileRequired: string
    targetFileRequired: string
    invalidFileType: string
    comparisonFailed: string
    exportFailed: string
    uploadError: string
    downloadError: string
    noResults: string
  }
  // Success messages - 成功消息
  success: {
    comparisonComplete: string
    resultsDownloaded: string
    markedExcelDownloaded: string
    fileUploaded: string
    copiedToClipboard: string
  }
  // Info messages - 信息消息
  info: {
    processing: string
    loading: string
    comparing: string
    exporting: string
  }
  // File validation messages - 文件验证消息
  fileValidation: {
    excelOnly: string
    duplicateFile: string
    fileSizeExceeded: string
  }
}

export const messages: Messages = {
  errors: {
    baseFileRequired: '请上传基准文件',
    targetFileRequired: '请上传对比文件',
    invalidFileType: '请上传 Excel 文件（.xlsx 或 .xls）',
    comparisonFailed: '对比失败',
    exportFailed: '导出失败',
    uploadError: '上传失败',
    downloadError: '下载失败',
    noResults: '没有发现变更',
  },
  success: {
    comparisonComplete: '对比完成',
    resultsDownloaded: '结果已下载',
    markedExcelDownloaded: '带标记的Excel文件已下载',
    fileUploaded: '文件上传成功',
    copiedToClipboard: '已复制到剪贴板',
  },
  info: {
    processing: '正在处理中...',
    loading: '加载中...',
    comparing: '正在对比...',
    exporting: '正在导出...',
  },
  fileValidation: {
    excelOnly: '仅支持 Excel 文件（.xlsx 或 .xls）',
    duplicateFile: '文件已添加',
    fileSizeExceeded: '文件大小超过限制（最大 10MB）',
  },
}

/**
 * 获取成功消息 - 附加变更数量
 * Get success message with change count
 */
export function getComparisonMessage(changeCount: number): string {
  return `${messages.success.comparisonComplete}！发现 ${changeCount} 处变更。`
}

/**
 * 获取下载消息
 * Get download message
 */
export function getDownloadMessage(filename: string): string {
  return `${messages.success.resultsDownloaded}: ${filename}`
}

/**
 * 格式化错误消息
 * Format error message
 */
export function formatErrorMessage(error: string | Error | unknown): string {
  if (error instanceof Error) {
    return `${messages.errors.comparisonFailed}: ${error.message}`
  }
  if (typeof error === 'string') {
    return `${messages.errors.comparisonFailed}: ${error}`
  }
  return messages.errors.comparisonFailed
}
