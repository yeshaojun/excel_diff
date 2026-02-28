/**
 * Excel Diff Tool - Frontend Application
 * Handles file uploads, comparison, and results display
 */

(function () {
  'use strict';

  // ============================================
  // State Management
  // ============================================
  const state = {
    baseFile: null,
    targetFiles: [],
    currentResults: null,
    currentOutput: '',
    currentFormat: 'text',
    activeTab: 'all',
  };

  // ============================================
  // DOM Elements
  // ============================================
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

  // ============================================
  // Utility Functions
  // ============================================
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
    elements.errorMessage.textContent = message;
    elements.errorToast.hidden = false;
    elements.errorToast.classList.add('visible');
    setTimeout(() => hideToast('error'), 5000);
  }

  function showSuccess(message) {
    elements.successMessage.textContent = message;
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
    elements.loadingOverlay.hidden = false;
  }

  function hideLoading() {
    elements.loadingOverlay.hidden = true;
  }

  function updateCompareButton() {
    elements.compareBtn.disabled = !(state.baseFile && state.targetFiles.length > 0);
  }

  // ============================================
  // File Handling
  // ============================================
  function handleBaseFile(file) {
    const ext = getFileExtension(file.name);
    if (!['xlsx', 'xls'].includes(ext)) {
      showError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    state.baseFile = file;
    elements.baseFileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
    elements.basePreview.classList.add('visible');
    elements.baseDropzone.querySelector('.dropzone-content').style.display = 'none';
    updateCompareButton();
  }

  function removeBaseFile() {
    state.baseFile = null;
    elements.baseFileInput.value = '';
    elements.basePreview.classList.remove('visible');
    elements.baseDropzone.querySelector('.dropzone-content').style.display = '';
    updateCompareButton();
  }

  function addTargetFile(file) {
    const ext = getFileExtension(file.name);
    if (!['xlsx', 'xls'].includes(ext)) {
      showError('Please upload Excel files only (.xlsx or .xls)');
      return;
    }

    // Check for duplicates
    if (state.targetFiles.some((f) => f.name === file.name)) {
      showError(`File "${file.name}" is already added`);
      return;
    }

    state.targetFiles.push(file);
    renderTargetFiles();
    updateCompareButton();
  }

  function removeTargetFile(index) {
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
        <button class="remove-btn" data-index="${index}" type="button" aria-label="Remove file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `
      )
      .join('');

    // Add event listeners to remove buttons
    elements.targetFileList.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index, 10);
        removeTargetFile(index);
      });
    });
  }

  // ============================================
  // Drag and Drop
  // ============================================
  function setupDropzone(dropzone, input, onFile, multiple = false) {
    // Click to open file dialog
    dropzone.addEventListener('click', () => input.click());

    // File input change
    input.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (multiple) {
        files.forEach(onFile);
      } else if (files[0]) {
        onFile(files[0]);
      }
    });

    // Drag events
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
      const files = Array.from(e.dataTransfer.files);
      if (multiple) {
        files.forEach(onFile);
      } else if (files[0]) {
        onFile(files[0]);
      }
    });
  }

  // ============================================
  // API Communication
  // ============================================
  async function compareFiles() {
    if (!state.baseFile || state.targetFiles.length === 0) return;

    showLoading();

    const formData = new FormData();
    formData.append('base', state.baseFile);
    state.targetFiles.forEach((file) => {
      formData.append('targets', file);
    });

    // Get options
    const options = {
      ignoreCase: elements.ignoreCase.checked,
      trimWhitespace: elements.trimWhitespace.checked,
      ignoreEmptyCells: elements.ignoreEmpty.checked,
      format: state.currentFormat,
    };
    formData.append('options', JSON.stringify(options));

    try {
      console.log('Sending comparison request...')
      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      })
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Comparison failed');
      }

      const result = await response.json();
      state.currentResults = result;
      state.currentOutput = result.output;

      displayResults(result);
      showSuccess(`Comparison complete! Found ${result.totalChanges} changes.`);
    } catch (error) {
      console.error('Error in compareFiles:', error)
      showError(error.message)
    } finally {
      console.log('Finally block executed')
      hideLoading()
    }
      showError(error.message);
    } finally {
      hideLoading();
    }
  }

  // ============================================
  // Results Display
  // ============================================
  function displayResults(result) {
    elements.resultsSection.hidden = false;

    // Render summary cards
    const { added, modified, deleted } = result.changeCounts;
    const total = added + modified + deleted;

    elements.summaryCards.innerHTML = `
      <div class="summary-card total">
        <div class="count">${total}</div>
        <div class="label">Total Changes</div>
      </div>
      <div class="summary-card added">
        <div class="count">${added}</div>
        <div class="label">Added</div>
      </div>
      <div class="summary-card modified">
        <div class="count">${modified}</div>
        <div class="label">Modified</div>
      </div>
      <div class="summary-card deleted">
        <div class="count">${deleted}</div>
        <div class="label">Deleted</div>
      </div>
    `;

    // Display output
    displayOutput();

    // Scroll to results
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function displayOutput() {
    if (!state.currentResults) return;

    let output = '';

    if (state.currentFormat === 'json') {
      // Format JSON with syntax highlighting
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

    // Filter changes by type
    const filtered = state.currentResults.raw.records.map((record) => ({
      ...record,
      changes: record.changes.filter((c) => c.changeType === type),
    }));

    if (state.currentFormat === 'json') {
      elements.resultsOutput.textContent = JSON.stringify(filtered, null, 2);
    } else {
      // Generate filtered text output
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
      lines.push(`File: ${record.fileName}`);
      lines.push(`${record.changes.length} ${type} change(s)`);
      lines.push('='.repeat(60));

      for (const change of record.changes) {
        lines.push(`\n  ${icon} Sheet: ${change.sheet} | Cell: ${change.cell}`);
        if (type !== 'added') {
          lines.push(`    Before: ${formatValue(change.oldValue)}`);
        }
        if (type !== 'deleted') {
          lines.push(`    After:  ${formatValue(change.newValue)}`);
        }
      }
    }

    return lines.join('\n') || `No ${type} changes found.`;
  }

  function formatValue(value) {
    if (value === undefined || value === null) return '(empty)';
    return String(value);
  }

  // ============================================
  // Download & Copy
  // ============================================
  function downloadResults() {
    if (!state.currentOutput) return;

    const formats = { text: 'txt', json: 'json', markdown: 'md', csv: 'csv' };
    const ext = formats[state.currentFormat] || 'txt';
    const mimeType = state.currentFormat === 'json' ? 'application/json' : 'text/plain';

    const blob = new Blob([state.currentOutput], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-results.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('Results downloaded!');
  }

  async function copyResults() {
    if (!state.currentOutput) return;

    try {
      await navigator.clipboard.writeText(state.currentOutput);
      showSuccess('Results copied to clipboard!');
    } catch {
      showError('Failed to copy to clipboard');
    }
  }

  // ============================================
  // Event Listeners
  // ============================================
  function setupEventListeners() {
    // Setup dropzones
    setupDropzone(elements.baseDropzone, elements.baseFileInput, handleBaseFile, false);
    setupDropzone(elements.targetDropzone, elements.targetFileInput, addTargetFile, true);

    // Remove base file
    elements.removeBase.addEventListener('click', (e) => {
      e.stopPropagation();
      removeBaseFile();
    });

    // Format selection
    elements.formatRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        state.currentFormat = e.target.value;
        if (state.currentResults) {
          // Re-fetch with new format
          compareFiles();
        }
      });
    });

    // Compare button
    elements.compareBtn.addEventListener('click', compareFiles);

    // Download & Copy
    elements.downloadBtn.addEventListener('click', downloadResults);
    elements.copyBtn.addEventListener('click', copyResults);

    // Tab buttons
    elements.tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        elements.tabButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeTab = btn.dataset.tab;
        filterByType(state.activeTab);
      });
    });

    // Toast close buttons
    elements.closeError.addEventListener('click', () => hideToast('error'));
    elements.closeSuccess.addEventListener('click', () => hideToast('success'));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape to close toasts
      if (e.key === 'Escape') {
        hideToast('error');
        hideToast('success');
      }
      // Enter to compare when button is focused
      if (e.key === 'Enter' && document.activeElement === elements.compareBtn) {
        compareFiles();
      }
    });
  }

  // ============================================
  // Initialize
  // ============================================
  function init() {
    setupEventListeners();
    console.log('Excel Diff Tool initialized');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
