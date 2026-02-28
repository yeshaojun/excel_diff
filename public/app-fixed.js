(function() {
  'use strict';

  console.log('Excel Diff Tool - Starting...');

  // State
  var state = {
    baseFile: null,
    targetFiles: [],
    results: null
  };

  // DOM Elements
  function getElements() {
    console.log('Getting DOM elements...');

    var baseDropzone = document.getElementById('baseDropzone');
    var baseFileInput = document.getElementById('baseFile');
    var basePreview = document.getElementById('basePreview');
    var baseDropzoneContent = document.getElementById('baseDropzoneContent');
    var baseFileName = document.getElementById('baseFileName');
    var removeBase = document.getElementById('removeBase');

    var targetDropzone = document.getElementById('targetDropzone');
    var targetFileInput = document.getElementById('targetFiles');
    var targetFileList = document.getElementById('targetFileList');
    var targetDropzoneContent = document.getElementById('targetDropzoneContent');

    var compareBtn = document.getElementById('compareBtn');
    var downloadBtn = document.getElementById('downloadBtn');
    var downloadMarkedBtn = document.getElementById('downloadMarkedBtn');
    var copyBtn = document.getElementById('copyBtn');

    var loadingOverlay = document.getElementById('loadingOverlay');
    var errorToast = document.getElementById('errorToast');
    var errorMessage = document.getElementById('errorMessage');
    var closeError = document.getElementById('closeError');
    var successToast = document.getElementById('successToast');
    var successMessage = document.getElementById('successMessage');

    var resultsSection = document.getElementById('resultsSection');
    var summaryCards = document.getElementById('summaryCards');
    var resultsOutput = document.getElementById('resultsOutput');
    var tabButtons = document.querySelectorAll('.tab-btn');

    var formatRadios = document.querySelectorAll('input[name="format"]');
    var ignoreCase = document.getElementById('ignoreCase');
    var trimWhitespace = document.getElementById('trimWhitespace');
    var ignoreEmpty = document.getElementById('ignoreEmpty');

    console.log('Elements retrieved:', {
      baseDropzone: !!baseDropzone,
      compareBtn: !!compareBtn,
      loadingOverlay: !!loadingOverlay
    });

    return {
      baseDropzone: baseDropzone,
      baseFileInput: baseFileInput,
      basePreview: basePreview,
      baseDropzoneContent: baseDropzoneContent,
      baseFileName: baseFileName,
      removeBase: removeBase,
      targetDropzone: targetDropzone,
      targetFileInput: targetFileInput,
      targetFileList: targetFileList,
      targetDropzoneContent: targetDropzoneContent,
      compareBtn: compareBtn,
      downloadBtn: downloadBtn,
      downloadMarkedBtn: downloadMarkedBtn,
      copyBtn: copyBtn,
      loadingOverlay: loadingOverlay,
      errorToast: errorToast,
      errorMessage: errorMessage,
      closeError: closeError,
      successToast: successToast,
      successMessage: successMessage,
      resultsSection: resultsSection,
      summaryCards: summaryCards,
      resultsOutput: resultsOutput,
      tabButtons: tabButtons,
      formatRadios: formatRadios,
      ignoreCase: ignoreCase,
      trimWhitespace: trimWhitespace,
      ignoreEmpty: ignoreEmpty
    };
  }

  // Utility functions
  function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function showLoading() {
    console.log('Showing loading...');
    var loading = document.getElementById('loadingOverlay');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  function hideLoading() {
    console.log('Hiding loading...');
    var loading = document.getElementById('loadingOverlay');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  function showError(msg) {
    console.error('Error:', msg);
    var errorToast = document.getElementById('errorToast');
    var errorMessage = document.getElementById('errorMessage');
    if (errorToast && errorMessage) {
      errorMessage.textContent = '错误: ' + msg;
      errorToast.style.display = 'flex';
      setTimeout(function() {
        errorToast.style.display = 'none';
      }, 5000);
    }
  }

  function showSuccess(msg) {
    console.log('Success:', msg);
    var successToast = document.getElementById('successToast');
    var successMessage = document.getElementById('successMessage');
    if (successToast && successMessage) {
      successMessage.textContent = msg;
      successToast.style.display = 'flex';
      setTimeout(function() {
        successToast.style.display = 'none';
      }, 3000);
    }
  }

  function updateCompareButton() {
    var compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
      compareBtn.disabled = !(state.baseFile && state.targetFiles.length > 0);
      console.log('Compare button disabled:', compareBtn.disabled);
    }
  }

  // File handling
  function handleBaseFile(file) {
    console.log('Handling base file:', file.name);
    if (!file) return;

    var ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      showError('请上传 Excel 文件（.xlsx 或 .xls）');
      return;
    }

    state.baseFile = file;

    var baseFileName = document.getElementById('baseFileName');
    var basePreview = document.getElementById('basePreview');
    var baseDropzoneContent = document.getElementById('baseDropzoneContent');
    var removeBase = document.getElementById('removeBase');

    if (baseFileName) {
      baseFileName.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
    }

    if (basePreview && baseDropzoneContent && removeBase) {
      basePreview.style.display = 'flex';
      baseDropzoneContent.style.display = 'none';
    }

    updateCompareButton();
  }

  function removeBaseFile() {
    console.log('Removing base file');
    state.baseFile = null;

    var baseFileInput = document.getElementById('baseFile');
    var basePreview = document.getElementById('basePreview');
    var baseDropzoneContent = document.getElementById('baseDropzoneContent');

    if (baseFileInput) baseFileInput.value = '';

    if (basePreview && baseDropzoneContent) {
      basePreview.style.display = 'none';
      baseDropzoneContent.style.display = 'block';
    }

    updateCompareButton();
  }

  function addTargetFile(file) {
    console.log('Adding target file:', file.name);
    if (!file) return;

    var ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      showError('请上传 Excel 文件（.xlsx 或 .xls）');
      return;
    }

    if (state.targetFiles.some(function(f) { return f.name === file.name; })) {
      showError('文件 "' + file.name + '" 已经添加');
      return;
    }

    state.targetFiles.push(file);
    renderTargetFiles();
    updateCompareButton();
  }

  function removeTargetFile(index) {
    console.log('Removing target file:', index);
    state.targetFiles.splice(index, 1);
    renderTargetFiles();
    updateCompareButton();
  }

  function renderTargetFiles() {
    var targetFileList = document.getElementById('targetFileList');
    var targetDropzoneContent = document.getElementById('targetDropzoneContent');

    if (!targetFileList) return;

    if (state.targetFiles.length === 0) {
      targetFileList.style.display = 'none';
      if (targetDropzoneContent) {
        targetDropzoneContent.style.display = 'block';
      }
      return;
    }

    targetFileList.style.display = 'flex';

    if (targetDropzoneContent) {
      targetDropzoneContent.style.display = 'none';
    }

    var html = '';
    for (var i = 0; i < state.targetFiles.length; i++) {
      var file = state.targetFiles[i];
      html += '<div class="file-list-item">';
      html += '<svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">';
      html += '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>';
      html += '<polyline points="14,2 14,8 20,8"/>';
      html += '</svg>';
      html += '<span class="file-name">' + file.name + ' (' + formatFileSize(file.size) + ')</span>';
      html += '<button class="remove-btn" data-index="' + i + '" type="button">×';
      html += '</button>';
      html += '</div>';
    }
    targetFileList.innerHTML = html;

    // Add event listeners to remove buttons
    var removeButtons = targetFileList.querySelectorAll('.remove-btn');
    removeButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var index = parseInt(this.getAttribute('data-index'), 10);
        removeTargetFile(index);
      });
    });
  }

  // Dropzone setup
  function setupDropzone(dropzoneId, inputId, isMultiple, handler) {
    console.log('Setting up dropzone:', dropzoneId);
    var dropzone = document.getElementById(dropzoneId);
    var input = document.getElementById(inputId);

    if (!dropzone || !input) {
      console.error('Dropzone or input not found:', dropzoneId, inputId);
      return;
    }

    // Click to open file dialog
    dropzone.addEventListener('click', function() {
      console.log('Dropzone clicked');
      input.click();
    });

    // File input change
    input.addEventListener('change', function(e) {
      console.log('File input changed:', e.target.files.length);
      var files = Array.from(e.target.files);
      if (isMultiple) {
        files.forEach(handler);
      } else if (files.length > 0) {
        handler(files[0]);
      }
    });

    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
      dropzone.addEventListener(eventName, function(e) {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(function(eventName) {
      dropzone.addEventListener(eventName, function() {
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function(eventName) {
      dropzone.addEventListener(eventName, function() {
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', function(e) {
      console.log('File dropped');
      var files = Array.from(e.dataTransfer.files);
      if (isMultiple) {
        files.forEach(handler);
      } else if (files.length > 0) {
        handler(files[0]);
      }
    });
  }

  // Compare files
  async function compareFiles() {
    console.log('Starting comparison...');
    if (!state.baseFile || state.targetFiles.length === 0) {
      showError('请先上传基准文件和对比文件');
      return;
    }

    showLoading();

    var formData = new FormData();
    formData.append('base', state.baseFile);
    state.targetFiles.forEach(function(file) {
      formData.append('targets', file);
    });

    var formatRadios = document.querySelectorAll('input[name="format"]');
    var format = 'text';
    formatRadios.forEach(function(radio) {
      if (radio.checked) format = radio.value;
    });

    var ignoreCase = document.getElementById('ignoreCase');
    var trimWhitespace = document.getElementById('trimWhitespace');
    var ignoreEmpty = document.getElementById('ignoreEmpty');

    var options = {
      ignoreCase: ignoreCase ? ignoreCase.checked : false,
      trimWhitespace: trimWhitespace ? trimWhitespace.checked : true,
      ignoreEmptyCells: ignoreEmpty ? ignoreEmpty.checked : false,
      format: format
    };
    formData.append('options', JSON.stringify(options));

    try {
      console.log('Sending request to /api/compare...');
      var response = await fetch('/api/compare', {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        var errorData = await response.json();
        throw new Error(errorData.error || '对比失败');
      }

      var result = await response.json();
      console.log('Comparison result:', result);
      state.results = result;

      displayResults(result);
      showSuccess('对比完成！发现 ' + result.totalChanges + ' 处变更。');
    } catch (error) {
      console.error('Comparison error:', error);
      showError('对比失败: ' + (error.message || '未知错误'));
    } finally {
      console.log('Hiding loading in finally');
      hideLoading();
    }
  }

  // Download marked Excel
  async function downloadMarkedExcel() {
    console.log('Downloading marked Excel...');
    if (!state.baseFile || state.targetFiles.length === 0) {
      showError('请先完成对比再下载');
      return;
    }

    showLoading();

    var formData = new FormData();
    formData.append('base', state.baseFile);
    formData.append('targets', state.targetFiles[0]);

    try {
      console.log('Sending request to /api/export-marked-excel...');
      var response = await fetch('/api/export-marked-excel', {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error('导出失败');
      }

      var blob = await response.blob();
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = '标记改动的Excel文件.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('带标记的Excel文件已下载');
    } catch (error) {
      console.error('Download error:', error);
      showError('下载失败: ' + (error.message || '未知错误'));
    } finally {
      hideLoading();
    }
  }

  // Display results
  function displayResults(result) {
    console.log('Displaying results...');
    var resultsSection = document.getElementById('resultsSection');
    var summaryCards = document.getElementById('summaryCards');
    var resultsOutput = document.getElementById('resultsOutput');

    if (!resultsSection) return;

    resultsSection.style.display = 'block';

    if (!summaryCards) {
      console.error('summaryCards not found');
      return;
    }

    var added = result.changeCounts ? result.changeCounts.added : 0;
    var modified = result.changeCounts ? result.changeCounts.modified : 0;
    var deleted = result.changeCounts ? result.changeCounts.deleted : 0;
    var total = added + modified + deleted;

    summaryCards.innerHTML = '<div class="summary-card total"><div class="count">' + total +
      '</div><div class="label">总变更数</div></div>' +
      '<div class="summary-card added"><div class="count">' + added +
      '</div><div class="label">新增</div></div>' +
      '<div class="summary-card modified"><div class="count">' + modified +
      '</div><div class="label">修改</div></div>' +
      '<div class="summary-card deleted"><div class="count">' + deleted +
      '</div><div class="label">删除</div></div>';

    if (resultsOutput && result.output) {
      resultsOutput.textContent = result.output;
    }

    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Download results
  function downloadResults() {
    console.log('Downloading results...');
    if (!state.results || !state.results.output) {
      showError('没有可下载的结果');
      return;
    }

    var formats = { text: 'txt', json: 'json', markdown: 'md', csv: 'csv' };
    var formatRadios = document.querySelectorAll('input[name="format"]');
    var format = 'text';
    formatRadios.forEach(function(radio) {
      if (radio.checked) format = radio.value;
    });

    var ext = formats[format] || 'txt';
    var mimeType = format === 'json' ? 'application/json' : 'text/plain';

    var blob = new Blob([state.results.output], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '对比结果.' + ext;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('结果已下载！');
  }

  // Copy results
  async function copyResults() {
    console.log('Copying results...');
    if (!state.results || !state.results.output) {
      showError('没有可复制的内容');
      return;
    }

    try {
      await navigator.clipboard.writeText(state.results.output);
      showSuccess('结果已复制到剪贴板！');
    } catch (error) {
      console.error('Copy error:', error);
      showError('复制到剪贴板失败');
    }
  }

  // Setup all event listeners
  function setupEventListeners() {
    console.log('Setting up event listeners...');

    setupDropzone('baseDropzone', 'baseFile', false, handleBaseFile);
    setupDropzone('targetDropzone', 'targetFiles', true, addTargetFile);

    var removeBase = document.getElementById('removeBase');
    if (removeBase) {
      removeBase.addEventListener('click', function(e) {
        e.stopPropagation();
        removeBaseFile();
      });
    }

    var compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
      compareBtn.addEventListener('click', compareFiles);
    }

    var downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', downloadResults);
    }

    var downloadMarkedBtn = document.getElementById('downloadMarkedBtn');
    if (downloadMarkedBtn) {
      downloadMarkedBtn.addEventListener('click', downloadMarkedExcel);
    }

    var copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyResults);
    }

    var tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        tabButtons.forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    var closeError = document.getElementById('closeError');
    if (closeError) {
      closeError.addEventListener('click', function() {
        var errorToast = document.getElementById('errorToast');
        if (errorToast) {
          errorToast.style.display = 'none';
        }
      });
    }

    var closeSuccess = document.getElementById('closeSuccess');
    if (closeSuccess) {
      closeSuccess.addEventListener('click', function() {
        var successToast = document.getElementById('successToast');
        if (successToast) {
          successToast.style.display = 'none';
        }
      });
    }

    console.log('Event listeners set up successfully');
  }

  // Initialize
  function init() {
    console.log('Initializing application...');
    getElements();
    setupEventListeners();
    hideLoading();  // Ensure loading is hidden on init
    console.log('Application initialized');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log('DOM already loaded, initializing immediately');
    init();
  }
})();
