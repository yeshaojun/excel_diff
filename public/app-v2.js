/**
 * Excel 对比工具 - 中文版前端
 * 处理文件上传、对比和结果显示
 */

(function () {
  'use strict';

  // 状态管理
  const state = {
    baseFile: null,
    targetFiles: [],
    currentResults: null,
    currentOutput: '',
    currentFormat: 'text',
    activeTab: 'all',
    baseData: null,
  };

  // DOM 元素
  const elements = {
    // Dropzones
    baseDropzone: document.getElementById('baseDropzone'),
    baseFileInput: document.getElementById('baseFile'),
    basePreview: document.getElementById('basePreview'),
    baseFileName: document.getElementById('baseFileName'),
    removeBase: document.getElementById('removeBase'),

    targetDropzone: document.getElementById('targetDropzone'),
    targetFileInput: document.getElementById('targetFiles'),
    targetFileList: document.getElementById('targetFileList'),

    // Options
    ignoreCase: document.getElementById('ignoreCase'),
    trimWhitespace: document.getElementById('trimWhitespace'),
    ignoreEmpty: document.getElementById('ignoreEmpty'),
    formatRadios: document.querySelectorAll('input[name="format"]'),

    // Buttons
    compareBtn: document.getElementById('compareBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    downloadMarkedBtn: document.getElementById('downloadMarkedBtn'),
    previewBtn: document.getElementById('previewBtn'),
    copyBtn: document.getElementById('copyBtn'),

    // Results
    resultsSection: document.getElementById('resultsSection'),
    summaryCards: document.getElementById('summaryCards'),
    resultsOutput: document.getElementById('resultsOutput'),
    tabButtons: document.querySelectorAll('.tab-btn'),

    // Loading & Toasts
    loadingOverlay: document.getElementById('loadingOverlay'),
    errorToast: document.getElementById('errorToast'),
    errorMessage: document.getElementById('errorMessage'),
    closeError: document.getElementById('closeError'),
    successToast: document.getElementById('successToast'),
    successMessage: document.getElementById('successMessage'),
    closeSuccess: document.getElementById('closeSuccess'),
  };

  // 工具函数
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function getFileExtension(filename) {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
  }

  function showError(message) {
    console.error('错误:', message);
    elements.errorMessage.textContent = '❌ ' + message;
    elements.errorToast.hidden = false;
    elements.errorToast.classList.add('visible');
    setTimeout(() => hideToast('error'), 5000);
  }

  function showSuccess(message) {
    console.log('成功:', message);
    elements.successMessage.textContent = '✅ ' + message;
    elements.successToast.hidden = false;
    elements.successToast.classList.add('visible');
    setTimeout(() => hideToast('success'), 3000);
  }

  function hideToast(type) {
    const toast = type === 'error' ? elements.errorToast : elements.successToast;
    toast.classList.remove('visible');
    setTimeout(() => {
      toast.hidden = true;
    }, 300);
  }

  function showLoading() {
    console.log('显示加载状态...');
    elements.loadingOverlay.hidden = false;
  }

  function hideLoading() {
    console.log('隐藏加载状态');
    elements.loadingOverlay.hidden = true;
  }

  function updateCompareButton() {
    elements.compareBtn.disabled = !(state.baseFile && state.targetFiles.length > 0);
    console.log('更新对比按钮状态:', elements.compareBtn.disabled);
  }

  // 文件处理
  function handleBaseFile(file) {
    console.log('处理基准文件:', file.name);
    const ext = getFileExtension(file.name);
    if (!['xlsx', 'xls'].includes(ext)) {
      showError('请上传 Excel 文件（.xlsx 或 .xls）');
      return;
    }

    state.baseFile = file;
    elements.baseFileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
    elements.basePreview.classList.add('visible');
    elements.baseDropzone.querySelector('.dropzone-content').style.display = 'none';
    updateCompareButton();
  }

  function removeBaseFile() {
    console.log('移除基准文件');
    state.baseFile = null;
    elements.baseFileInput.value = '';
    elements.basePreview.classList.remove('visible');
    elements.baseDropzone.querySelector('.dropzone-content').style.display = '';
    updateCompareButton();
  }

  function addTargetFile(file) {
    console.log('添加对比文件:', file.name);
    const ext = getFileExtension(file.name);
    if (!['xlsx', 'xls'].includes(ext)) {
      showError('请上传 Excel 文件（.xlsx 或 .xls）');
      return;
    }

    if (state.targetFiles.some((f) => f.name === file.name)) {
      showError(`文件 "${file.name}" 已经添加`);
      return;
    }

    state.targetFiles.push(file);
    renderTargetFiles();
    updateCompareButton();
  }

  function removeTargetFile(index) {
    console.log('移除对比文件:', index);
    state.targetFiles.splice(index, 1);
    renderTargetFiles();
    updateCompareButton();
  }

  function renderTargetFiles() {
    if (state.targetFiles.length === 0) {
      elements.targetFileList.classList.remove('visible');
      elements.targetDropzone.querySelector('.dropzone-content').style.display = '';
      return;
    }

    elements.targetFileList.classList.add('visible');
    elements.targetDropzone.querySelector('.dropzone-content').style.display = 'none';

    elements.targetFileList.innerHTML = state.targetFiles
      .map(
        (file, index) => `
      <div class="file-list-item">
        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
        <span class="file-name">${file.name} (${formatFileSize(file.size)})</span>
        <button class="remove-btn" data-index="${index}" type="button" aria-label="移除文件">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `
      )
      .join('');

    elements.targetFileList.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index, 10);
        removeTargetFile(index);
      });
    });
  }

  // 拖放
  function setupDropzone(dropzone, input, onFile, multiple = false) {
    console.log('设置拖放区:', dropzone.id);
    dropzone.addEventListener('click', () => input.click());

    input.addEventListener('change', (e) => {
      console.log('文件选择变化:', e.target.files.length);
      const files = Array.from(e.target.files);
      if (multiple) {
        files.forEach(onFile);
      } else if (files[0]) {
        onFile(files[0]);
      }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(eventName, () => {
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(eventName, () => {
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      console.log('文件拖放');
      const files = Array.from(e.dataTransfer.files);
      if (multiple) {
        files.forEach(onFile);
      } else if (files[0]) {
        onFile(files[0]);
      }
    });
  }

  // 对比文件
  async function compareFiles() {
    if (!state.baseFile || state.targetFiles.length === 0) {
      console.warn('缺少文件，无法对比');
      return;
    }

    showLoading();

    const formData = new FormData();
    formData.append('base', state.baseFile);
    state.targetFiles.forEach((file) => {
      formData.append('targets', file);
    });

    const options = {
      ignoreCase: elements.ignoreCase.checked,
      trimWhitespace: elements.trimWhitespace.checked,
      ignoreEmptyCells: elements.ignoreEmpty.checked,
      format: state.currentFormat,
    };
    formData.append('options', JSON.stringify(options));

    try {
      console.log('发送对比请求...');
      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      console.log('收到响应:', response.status, response.ok);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '对比失败');
      }

      const result = await response.json();
      console.log('对比结果:', result);
      state.currentResults = result;
      state.currentOutput = result.output;

      displayResults(result);
      showSuccess(`对比完成！发现 ${result.totalChanges} 处变更。`);
    } catch (error) {
      console.error('对比错误:', error);
      showError(error.message || '对比过程中发生错误');
    } finally {
      hideLoading();
    }
  }

  // 下载带标记的Excel
  async function downloadMarkedExcel() {
    if (!state.baseFile || state.targetFiles.length === 0) {
      showError('请先完成对比再下载');
      return;
    }

    showLoading();

    const formData = new FormData();
    formData.append('base', state.baseFile);
    formData.append('targets', state.targetFiles[0]);

    try {
      console.log('下载带标记的Excel...');
      const response = await fetch('/api/export-marked-excel', {
        method: 'POST',
        body: formData,
      });

      console.log('响应状态:', response.status);

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '标记改动的Excel文件.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('带标记的Excel文件已下载');
    } catch (error) {
      console.error('下载错误:', error);
      showError('下载失败: ' + error.message);
    } finally {
      hideLoading();
    }
  }
  // Show preview modal
  async function showPreview() {
    const previewModal = document.getElementById('previewModal');
    const previewContent = document.getElementById('previewContent');
    const excelPreviewContainer = document.getElementById('excelPreviewContainer');

    if (!state.baseFile || state.targetFiles.length === 0) {
      if (previewModal) {
        previewModal.style.display = 'flex';
      }
      if (previewContent) {
        previewContent.style.display = 'block';
        previewContent.innerHTML = '<p class="preview-hint">请先上传文件并完成对比</p>';
      }
      return;
    }

    if (previewModal && previewContent && excelPreviewContainer) {
      previewModal.style.display = 'flex';
      previewContent.style.display = 'block';
      previewContent.innerHTML = '<p class="preview-loading">正在生成预览...</p>';
      excelPreviewContainer.innerHTML = '';

      try {
        const formData = new FormData();
        formData.append('base', state.baseFile);
        formData.append('targets', state.targetFiles[0]);

        const response = await fetch('/api/export-marked-excel', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('生成预览失败');
        }

        const blob = await response.blob();
        console.log('Excel file loaded for preview, size:', blob.size);

        const arrayBuffer = await blob.arrayBuffer();

        const myExcelPreviewer = jsPreviewExcel.init(excelPreviewContainer, {
          showLogo: false,
          lang: 'zh-CN'
        });

        myExcelPreviewer.preview(arrayBuffer).then(function(res) {
          console.log('预览完成:', res);
          previewContent.style.display = 'none';
        }).catch(function(e) {
          console.error('预览失败:', e);
          previewContent.style.display = 'block';
          previewContent.innerHTML = '<p class="preview-error">预览失败: ' + e.message + '</p>';
        });
      } catch (error) {
        console.error('预览错误:', error);
        previewContent.style.display = 'block';
        previewContent.innerHTML = '<p class="preview-error">生成预览失败: ' + error.message + '</p>';
      }
    }
  }

  // 显示结果
  function displayResults(result) {
    console.log('显示结果');
    elements.resultsSection.hidden = false;

    // 渲染统计卡片
    const { added, modified, deleted } = result.changeCounts;
    const total = added + modified + deleted;

    elements.summaryCards.innerHTML = `
      <div class="summary-card total">
        <div class="count">${total}</div>
        <div class="label">总变更数</div>
      </div>
      <div class="summary-card added">
        <div class="count">${added}</div>
        <div class="label">新增</div>
      </div>
      <div class="summary-card modified">
        <div class="count">${modified}</div>
        <div class="label">修改</div>
      </div>
      <div class="summary-card deleted">
        <div class="count">${deleted}</div>
        <div class="label">删除</div>
      </div>
    `;

    displayOutput();
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function displayOutput() {
    if (!state.currentResults) return;

    let output = '';

    if (state.currentFormat === 'json') {
      output = JSON.stringify(state.currentResults.raw, null, 2);
    } else {
      output = state.currentOutput;
    }

    elements.resultsOutput.textContent = output;
  }

  function filterByType(type) {
    if (!state.currentResults || !state.currentResults.raw) return;

    if (type === 'all') {
      displayOutput();
      return;
    }

    const filtered = state.currentResults.raw.records.map((record) => ({
      ...record,
      changes: record.changes.filter((c) => c.changeType === type),
    }));

    if (state.currentFormat === 'json') {
      elements.resultsOutput.textContent = JSON.stringify(filtered, null, 2);
    } else {
      const output = generateFilteredOutput(filtered, type);
      elements.resultsOutput.textContent = output;
    }
  }

  function generateFilteredOutput(records, type) {
    const lines = [];
    const icons = { added: '+', modified: '~', deleted: '-' };
    const icon = icons[type] || '•';

    for (const record of records) {
      if (record.changes.length === 0) continue;

      lines.push(`\n${'='.repeat(60)}`);
      lines.push(`文件: ${record.fileName}`);
      lines.push(`${record.changes.length} 处${type}变更`);
      lines.push('='.repeat(60));

      for (const change of record.changes) {
        lines.push(`\n  ${icon} 工作表: ${change.sheet} | 单元格: ${change.cell}`);
        if (type !== 'added') {
          lines.push(`    修改前: ${formatValue(change.oldValue)}`);
        }
        if (type !== 'deleted') {
          lines.push(`    修改后: ${formatValue(change.newValue)}`);
        }
      }
    }

    return lines.join('\n') || `未发现${type}变更。`;
  }

  function formatValue(value) {
    if (value === undefined || value === null) return '(空)';
    return String(value);
  }

  // Close preview modal
  function closePreview() {
    const previewModal = document.getElementById('previewModal');
    const previewContent = document.getElementById('previewContent');
    const excelPreviewContainer = document.getElementById('excelPreviewContainer');

    if (previewModal) {
      previewModal.style.display = 'none';
    }

    if (previewContent) {
      previewContent.style.display = 'block';
      previewContent.innerHTML = '<p class="preview-hint">点击"在线预览"按钮查看带标记的Excel文件</p>';
    }

    if (excelPreviewContainer) {
      excelPreviewContainer.innerHTML = '';
    }
  }

  // 下载和复制
  function downloadResults() {
    if (!state.currentOutput) {
      showError('没有可下载的结果');
      return;
    }

    const formats = { text: 'txt', json: 'json', markdown: 'md', csv: 'csv' };
    const ext = formats[state.currentFormat] || 'txt';
    const mimeType = state.currentFormat === 'json' ? 'application/json' : 'text/plain';

    const blob = new Blob([state.currentOutput], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `对比结果.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('结果已下载！');
  }

  async function copyResults() {
    if (!state.currentOutput) {
      showError('没有可复制的内容');
      return;
    }

    try {
      await navigator.clipboard.writeText(state.currentOutput);
      showSuccess('结果已复制到剪贴板！');
    } catch {
      showError('复制到剪贴板失败');
    }
  }

  // 事件监听
  function setupEventListeners() {
    console.log('设置事件监听器');
    setupDropzone(elements.baseDropzone, elements.baseFileInput, handleBaseFile, false);
    setupDropzone(elements.targetDropzone, elements.targetFileInput, addTargetFile, true);

    elements.removeBase.addEventListener('click', (e) => {
      e.stopPropagation();
      removeBaseFile();
    });

    elements.formatRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        state.currentFormat = e.target.value;
        if (state.currentResults) {
          compareFiles();
        }
      });
    });

    elements.compareBtn.addEventListener('click', compareFiles);
    elements.downloadBtn.addEventListener('click', downloadResults);
    elements.downloadMarkedBtn.addEventListener('click', downloadMarkedExcel);
    elements.copyBtn.addEventListener('click', copyResults);

    if (elements.previewBtn) {
      elements.previewBtn.addEventListener('click', () => showPreview());
    }
    document.getElementById('closePreview')?.addEventListener('click', closePreview);

    elements.tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        elements.tabButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeTab = btn.dataset.tab;
        filterByType(state.activeTab);
      });
    });

    elements.closeError.addEventListener('click', () => hideToast('error'));
    elements.closeSuccess.addEventListener('click', () => hideToast('success'));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideToast('error');
        hideToast('success');
      }
      if (e.key === 'Enter' && document.activeElement === elements.compareBtn) {
        compareFiles();
      }
    });
  }

  // 初始化
  function init() {
    console.log('初始化 Excel 对比工具');
    setupEventListeners();
  }

  // DOM 加载完成后运行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
