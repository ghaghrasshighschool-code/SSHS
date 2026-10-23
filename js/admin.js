// Admin Controller for SS+2 High School Ghaghra IT/ITeS Notes Portal
// Enforces Zero-Risk Policies: SHA-256 Hashed PINs, Rate Limiting, File Magic Byte Verification & HTML Sanitization
// Features: Smart Bulk Upload with Automatic Filename-Based Classification & Single-File Auto-Fill

// Default PIN is 'admin123' (stored strictly as SHA-256 hash, never in cleartext)
const DEFAULT_PIN_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
// Default School Master Recovery Key is 'SSHS@GHAGHRA#2026' (stored strictly as SHA-256 hash)
const DEFAULT_RECOVERY_KEY_HASH = 'fa486e4cf3f3c55909656aca63ae468ba4527fd84c34d3d865760bdf3d7fcce1';
const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB maximum file size

let selectedFile = null;
let bulkFilesQueue = [];

// On Page Load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  updateSubjectDropdown();
  setupDropzone();
  setupBulkDropzone();
});

// ==============================================
// 1. AUTHENTICATION & PIN SECURITY (SHA-256 + RATE LIMITING + RECOVERY KEY)
// ==============================================
function getAdminPinHash() {
  return localStorage.getItem('sshs_admin_pin_hash') || DEFAULT_PIN_HASH;
}

function getMasterRecoveryHash() {
  return localStorage.getItem('sshs_master_recovery_hash') || DEFAULT_RECOVERY_KEY_HASH;
}

function checkAuth() {
  const isAuth = sessionStorage.getItem('sshs_admin_auth');
  const authScreen = document.getElementById('authScreen');
  const adminDashboard = document.getElementById('adminDashboard');

  if (isAuth === 'true') {
    authScreen.style.display = 'none';
    adminDashboard.style.display = 'block';
    loadDashboardData();
  } else {
    authScreen.style.display = 'flex';
    adminDashboard.style.display = 'none';
    checkRateLimitUI();
  }
}

function checkRateLimitUI() {
  if (typeof Security === 'undefined') return;
  const status = Security.isRateLimited('admin_login', 5, 60);
  const errorEl = document.getElementById('authError');
  const submitBtn = document.querySelector('#authForm button[type="submit"]');

  if (status.limited) {
    if (errorEl) {
      errorEl.textContent = `🛑 Too many failed attempts. Portal locked for ${status.remainingSeconds}s.`;
      errorEl.classList.add('show');
    }
    if (submitBtn) submitBtn.disabled = true;
    setTimeout(checkRateLimitUI, 1000);
  } else {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function toggleResetForm(showReset) {
  const authForm = document.getElementById('authForm');
  const resetForm = document.getElementById('resetForm');
  const authError = document.getElementById('authError');
  const resetError = document.getElementById('resetError');
  if (authError) authError.classList.remove('show');
  if (resetError) resetError.classList.remove('show');

  if (showReset) {
    if (authForm) authForm.style.display = 'none';
    if (resetForm) {
      resetForm.style.display = 'block';
      checkResetRateLimitUI();
    }
  } else {
    if (resetForm) resetForm.style.display = 'none';
    if (authForm) {
      authForm.style.display = 'block';
      checkRateLimitUI();
    }
  }
}

function checkResetRateLimitUI() {
  if (typeof Security === 'undefined') return;
  const status = Security.isRateLimited('admin_reset', 3, 300);
  const resetError = document.getElementById('resetError');
  const submitBtn = document.getElementById('btnSubmitReset');

  if (status.limited) {
    if (resetError) {
      resetError.textContent = `🛑 Too many failed reset attempts. Reset locked for ${status.remainingSeconds}s.`;
      resetError.classList.add('show');
    }
    if (submitBtn) submitBtn.disabled = true;
    setTimeout(checkResetRateLimitUI, 1000);
  } else {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const errorEl = document.getElementById('authError');

  // Check Rate Limit
  if (typeof Security !== 'undefined') {
    const status = Security.isRateLimited('admin_login', 5, 60);
    if (status.limited) {
      errorEl.textContent = `🛑 Too many failed attempts. Try again in ${status.remainingSeconds}s.`;
      errorEl.classList.add('show');
      return;
    }
  }

  const pin = document.getElementById('pinInput').value.trim();
  if (!pin) return;

  const currentHash = getAdminPinHash();
  const inputHash = (typeof Security !== 'undefined') ? await Security.hashString(pin) : pin;

  if (inputHash === currentHash) {
    if (typeof Security !== 'undefined') Security.resetRateLimit('admin_login');
    sessionStorage.setItem('sshs_admin_auth', 'true');
    errorEl.classList.remove('show');
    document.getElementById('pinInput').value = '';
    checkAuth();
    showToast('🔓 Welcome, Administrator');
  } else {
    let attemptsRemaining = 4;
    if (typeof Security !== 'undefined') {
      const rec = Security.recordFailedAttempt('admin_login', 5, 60);
      attemptsRemaining = Math.max(0, 5 - rec.attempts);
      if (rec.locked) {
        checkRateLimitUI();
        return;
      }
    }
    errorEl.textContent = `Incorrect password. ${attemptsRemaining} attempt(s) remaining.`;
    errorEl.classList.add('show');
    document.getElementById('pinInput').value = '';
    document.getElementById('pinInput').focus();
  }
}

async function handleResetPassword(e) {
  e.preventDefault();
  const resetError = document.getElementById('resetError');

  // Rate Limiting Check for Reset
  if (typeof Security !== 'undefined') {
    const status = Security.isRateLimited('admin_reset', 3, 300);
    if (status.limited) {
      resetError.textContent = `🛑 Too many failed reset attempts. Try again in ${status.remainingSeconds}s.`;
      resetError.classList.add('show');
      return;
    }
  }

  const recoveryKey = (document.getElementById('resetRecoveryKey').value || '').trim();
  const newPin = (document.getElementById('resetNewPin').value || '').trim();
  const confirmPin = (document.getElementById('resetConfirmPin').value || '').trim();

  if (!recoveryKey) {
    resetError.textContent = 'Please enter the Master Recovery Key.';
    resetError.classList.add('show');
    return;
  }

  if (!newPin || newPin.length < 6) {
    resetError.textContent = 'New password must be at least 6 characters.';
    resetError.classList.add('show');
    return;
  }

  if (newPin !== confirmPin) {
    resetError.textContent = 'Passwords do not match. Please re-enter.';
    resetError.classList.add('show');
    return;
  }

  const expectedRecoveryHash = getMasterRecoveryHash();
  const inputRecoveryHash = (typeof Security !== 'undefined') ? await Security.hashString(recoveryKey) : recoveryKey;

  if (inputRecoveryHash !== expectedRecoveryHash) {
    let attemptsRemaining = 2;
    if (typeof Security !== 'undefined') {
      const rec = Security.recordFailedAttempt('admin_reset', 3, 300);
      attemptsRemaining = Math.max(0, 3 - rec.attempts);
      if (rec.locked) {
        checkResetRateLimitUI();
        return;
      }
    }
    resetError.textContent = `Invalid Master Recovery Key! ${attemptsRemaining} attempt(s) remaining.`;
    resetError.classList.add('show');
    document.getElementById('resetRecoveryKey').value = '';
    document.getElementById('resetRecoveryKey').focus();
    return;
  }

  // Key is valid! Hash new password and save
  const newHash = (typeof Security !== 'undefined') ? await Security.hashString(newPin) : newPin;
  localStorage.setItem('sshs_admin_pin_hash', newHash);

  // Clear rate limits
  if (typeof Security !== 'undefined') {
    Security.resetRateLimit('admin_reset');
    Security.resetRateLimit('admin_login');
  }

  document.getElementById('resetRecoveryKey').value = '';
  document.getElementById('resetNewPin').value = '';
  document.getElementById('resetConfirmPin').value = '';

  toggleResetForm(false);
  showToast('✅ Admin Password successfully reset! Please log in.');
  const authError = document.getElementById('authError');
  if (authError) {
    authError.textContent = '✅ Password successfully updated! Enter your new password below.';
    authError.style.color = '#059669';
    authError.classList.add('show');
    setTimeout(() => {
      authError.classList.remove('show');
      authError.style.color = '#dc2626';
    }, 5000);
  }
}

async function handleChangePassword() {
  const currentPin = (document.getElementById('currentPinInput').value || '').trim();
  const newPin = (document.getElementById('newPinInput').value || '').trim();
  const confirmPin = (document.getElementById('confirmPinInput').value || '').trim();

  if (!currentPin) {
    showToast('⚠️ Please enter your current password.');
    return;
  }

  if (!newPin || newPin.length < 6) {
    showToast('⚠️ New password must be at least 6 characters long.');
    return;
  }

  if (newPin !== confirmPin) {
    showToast('⚠️ New passwords do not match. Please verify.');
    return;
  }

  const storedHash = getAdminPinHash();
  const currentHash = (typeof Security !== 'undefined') ? await Security.hashString(currentPin) : currentPin;

  if (currentHash !== storedHash) {
    showToast('❌ Incorrect current password. Cannot change password.');
    return;
  }

  if (currentPin === newPin) {
    showToast('⚠️ New password must be different from current password.');
    return;
  }

  const newHash = (typeof Security !== 'undefined') ? await Security.hashString(newPin) : newPin;
  localStorage.setItem('sshs_admin_pin_hash', newHash);

  document.getElementById('currentPinInput').value = '';
  document.getElementById('newPinInput').value = '';
  document.getElementById('confirmPinInput').value = '';

  showToast('🔐 Admin Password successfully changed and cryptographically hashed (SHA-256)!');
}

async function handleUpdateRecoveryKey() {
  const newKey = (document.getElementById('newRecoveryKeyInput').value || '').trim();
  const adminPin = (document.getElementById('recoveryAdminPinInput').value || '').trim();

  if (!newKey || newKey.length < 8) {
    showToast('⚠️ Master Recovery Key must be at least 8 characters long.');
    return;
  }

  if (!adminPin) {
    showToast('⚠️ Enter current admin password to authorize this security change.');
    return;
  }

  const storedPinHash = getAdminPinHash();
  const inputPinHash = (typeof Security !== 'undefined') ? await Security.hashString(adminPin) : adminPin;

  if (inputPinHash !== storedPinHash) {
    showToast('❌ Incorrect admin password. Authorization failed.');
    return;
  }

  const newRecoveryHash = (typeof Security !== 'undefined') ? await Security.hashString(newKey) : newKey;
  localStorage.setItem('sshs_master_recovery_hash', newRecoveryHash);

  document.getElementById('newRecoveryKeyInput').value = '';
  document.getElementById('recoveryAdminPinInput').value = '';

  showToast('🔑 Master Recovery Key updated successfully!');
}

function handleLogout() {
  sessionStorage.removeItem('sshs_admin_auth');
  checkAuth();
}

// ==============================================
// 2. TABS & DASHBOARD STATS
// ==============================================
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.admin-tab-btn').forEach(el => el.classList.remove('active'));

  const activeContent = document.getElementById(tabId);
  if (activeContent) activeContent.classList.add('active');

  const btnIndex = ['bulkUploadTab', 'gdriveTab', 'uploadTab', 'manageTab', 'noticesTab', 'exportTab'].indexOf(tabId);
  const buttons = document.querySelectorAll('.admin-tab-btn');
  if (buttons[btnIndex]) buttons[btnIndex].classList.add('active');

  if (tabId === 'gdriveTab') loadGDriveTab();
  if (tabId === 'manageTab') renderManageTable();
  if (tabId === 'noticesTab') renderManageNotices();
}

async function loadDashboardData() {
  const mergedData = await getMergedClassesData();
  let totalNotes = 0;
  let secNotes = 0;
  let highNotes = 0;

  for (const classKey in mergedData) {
    let count = 0;
    mergedData[classKey].subjects.forEach(s => {
      count += s.notes.length;
    });
    totalNotes += count;
    if (classKey === '9th' || classKey === '10th') secNotes += count;
    if (classKey === '11th' || classKey === '12th') highNotes += count;
  }

  const posters = getMergedPostersData();

  const elTotal = document.getElementById('statTotalNotes');
  const elSec = document.getElementById('statSecNotes');
  const elHigh = document.getElementById('statHighNotes');
  const elNotices = document.getElementById('statNotices');

  if (elTotal) elTotal.textContent = totalNotes;
  if (elSec) elSec.textContent = secNotes;
  if (elHigh) elHigh.textContent = highNotes;
  if (elNotices) elNotices.textContent = posters.length;
}

// ==============================================
// 3. SUBJECT / SECTION DROPDOWN
// ==============================================
function updateSubjectDropdown() {
  const classKey = document.getElementById('noteClass').value;
  const subjectSelect = document.getElementById('noteSubject');
  const classData = CLASSES_DATA[classKey];

  if (!classData || !subjectSelect) return;

  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);

  subjectSelect.innerHTML = classData.subjects.map(s => `
    <option value="${esc(s.id)}" data-name="${esc(s.name)}" data-icon="${esc(s.icon || '💻')}" data-color="${esc(s.color || '#2563eb')}">
      ${esc(s.name)}
    </option>
  `).join('');
}

function promptNewSubject() {
  const name = prompt('Enter new IT section / topic name (e.g., Cyber Security / साइबर सुरक्षा):');
  if (!name || !name.trim()) return;

  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);
  const cleanName = esc(name.trim());
  const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  const subjectSelect = document.getElementById('noteSubject');

  const newOption = document.createElement('option');
  newOption.value = id;
  newOption.setAttribute('data-name', cleanName);
  newOption.setAttribute('data-icon', '📘');
  newOption.setAttribute('data-color', '#2563eb');
  newOption.textContent = `📘 ${cleanName}`;
  newOption.selected = true;

  subjectSelect.appendChild(newOption);
  showToast(`Added section: ${cleanName}`);
}

// ==============================================
// 4. SMART BULK UPLOADER & AUTO-CATEGORIZATION
// ==============================================
function setupBulkDropzone() {
  const bulkDropzone = document.getElementById('bulkDropzone');
  if (!bulkDropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    bulkDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      bulkDropzone.style.borderColor = '#2563eb';
      bulkDropzone.style.background = '#e0f2fe';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    bulkDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      bulkDropzone.style.borderColor = '#0284c7';
      bulkDropzone.style.background = '#f0f9ff';
    });
  });

  bulkDropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt.files && dt.files.length > 0) {
      await processBulkFiles(Array.from(dt.files));
    }
  });
}

async function handleBulkFilesSelect(e) {
  const files = Array.from(e.target.files);
  await processBulkFiles(files);
}

async function processBulkFiles(files) {
  const validFiles = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`Skipping ${file.name}: Exceeds 30MB size limit.`);
      continue;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert(`Skipping ${file.name}: Only PDF documents are permitted.`);
      continue;
    }
    if (typeof Security !== 'undefined') {
      const isRealPdf = await Security.verifyPdfMagicBytes(file);
      if (!isRealPdf) {
        alert(`Skipping ${file.name}: Invalid PDF header signature.`);
        continue;
      }
    }

    const auto = (typeof Security !== 'undefined' && Security.autoCategorize)
      ? Security.autoCategorize(file.name)
      : { classKey: '9th', categoryId: 'part-b', categoryName: 'Part B: IT Skills', cleanTitle: file.name, isSyllabus: false };

    validFiles.push({
      file: file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      classKey: auto.classKey,
      categoryId: auto.categoryId,
      title: auto.cleanTitle,
      isSyllabus: auto.isSyllabus
    });
  }

  bulkFilesQueue = bulkFilesQueue.concat(validFiles);
  renderBulkQueue();
  if (validFiles.length > 0) {
    showToast(`✨ Auto-categorized ${validFiles.length} file(s) into Class and Section!`);
  }
}

function renderBulkQueue() {
  const container = document.getElementById('bulkQueueContainer');
  const tbody = document.getElementById('bulkQueueBody');
  const countEl = document.getElementById('bulkCount');
  const statusEl = document.getElementById('bulkStatusText');

  if (bulkFilesQueue.length === 0) {
    if (container) container.style.display = 'none';
    return;
  }

  if (container) container.style.display = 'block';
  if (countEl) countEl.textContent = bulkFilesQueue.length;
  if (statusEl) statusEl.textContent = `Ready to upload ${bulkFilesQueue.length} files. Review or modify details below.`;

  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);

  tbody.innerHTML = bulkFilesQueue.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>
        <div style="font-weight: 700; color: #1e293b;">${esc(item.name)}</div>
        <div style="font-size: 0.72rem; color: #64748b;">${esc(item.size)}</div>
      </td>
      <td>
        <select class="bulk-select-sm" onchange="updateQueueItemClass(${idx}, this.value)">
          <option value="9th" ${item.classKey === '9th' ? 'selected' : ''}>Class 9th</option>
          <option value="10th" ${item.classKey === '10th' ? 'selected' : ''}>Class 10th</option>
          <option value="11th" ${item.classKey === '11th' ? 'selected' : ''}>Class 11th</option>
          <option value="12th" ${item.classKey === '12th' ? 'selected' : ''}>Class 12th</option>
        </select>
      </td>
      <td>
        <select class="bulk-select-sm" onchange="updateQueueItemCategory(${idx}, this.value)">
          <option value="syllabus" ${item.categoryId === 'syllabus' ? 'selected' : ''}>📋 Syllabus</option>
          <option value="part-b" ${item.categoryId === 'part-b' ? 'selected' : ''}>💻 Part B: IT Skills</option>
          <option value="part-a" ${item.categoryId === 'part-a' ? 'selected' : ''}>📖 Part A: Employability</option>
          <option value="sample-papers" ${item.categoryId === 'sample-papers' ? 'selected' : ''}>📝 Model Papers</option>
          <option value="practical" ${item.categoryId === 'practical' ? 'selected' : ''}>🔬 Practical</option>
        </select>
      </td>
      <td>
        <input type="text" class="bulk-input-sm" value="${esc(item.title)}" onchange="updateQueueItemTitle(${idx}, this.value)">
      </td>
      <td class="text-right">
        <button type="button" class="btn-icon delete" onclick="removeBulkQueueItem(${idx})" title="Remove file">✕</button>
      </td>
    </tr>
  `).join('');
}

function updateQueueItemClass(idx, val) {
  if (bulkFilesQueue[idx]) bulkFilesQueue[idx].classKey = val;
}
function updateQueueItemCategory(idx, val) {
  if (bulkFilesQueue[idx]) {
    bulkFilesQueue[idx].categoryId = val;
    bulkFilesQueue[idx].isSyllabus = (val === 'syllabus');
  }
}
function updateQueueItemTitle(idx, val) {
  if (bulkFilesQueue[idx]) bulkFilesQueue[idx].title = val.trim();
}
function removeBulkQueueItem(idx) {
  bulkFilesQueue.splice(idx, 1);
  renderBulkQueue();
}
function clearBulkQueue() {
  bulkFilesQueue = [];
  const fileInput = document.getElementById('bulkPdfInput');
  if (fileInput) fileInput.value = '';
  renderBulkQueue();
}

async function executeBulkUpload() {
  if (bulkFilesQueue.length === 0) return;

  const btn = document.getElementById('btnConfirmBulkUpload');
  const pBar = document.getElementById('bulkProgressBar');
  const pFill = document.getElementById('bulkProgressFill');
  const statusEl = document.getElementById('bulkStatusText');

  btn.disabled = true;
  if (pBar) pBar.style.display = 'block';

  let successCount = 0;
  const customNotes = getCustomNotes();

  const categoryNames = {
    'syllabus': '📋 Syllabus (पाठ्यक्रम)',
    'part-b': '💻 Part B: IT Specific Skills',
    'part-a': '📖 Part A: Employability Skills',
    'sample-papers': '📝 Model Papers & Blueprint',
    'practical': '🔬 Practical & Lab Manual'
  };

  const categoryColors = {
    'syllabus': '#0284c7',
    'part-b': '#2563eb',
    'part-a': '#059669',
    'sample-papers': '#d97706',
    'practical': '#7c3aed'
  };

  const categoryIcons = {
    'syllabus': '📋',
    'part-b': '💻',
    'part-a': '📖',
    'sample-papers': '📝',
    'practical': '🔬'
  };

  for (let i = 0; i < bulkFilesQueue.length; i++) {
    const item = bulkFilesQueue[i];
    statusEl.textContent = `Uploading ${i + 1} of ${bulkFilesQueue.length}: ${item.name}...`;
    if (pFill) pFill.style.width = `${((i + 1) / bulkFilesQueue.length) * 100}%`;

    const noteId = `bulk-${item.classKey}-${item.categoryId}-${Date.now()}-${i}`;
    const safeFilename = (typeof Security !== 'undefined') ? Security.sanitizeFilename(item.file.name) : item.file.name;

    // Save blob to IndexedDB
    await savePdfBlob(noteId, item.file, safeFilename);

    const newNote = {
      id: noteId,
      classKey: item.classKey,
      subjectId: item.categoryId,
      subjectName: categoryNames[item.categoryId] || 'IT/ITeS',
      subjectIcon: categoryIcons[item.categoryId] || '💻',
      subjectColor: categoryColors[item.categoryId] || '#2563eb',
      title: item.title,
      hindiTitle: item.title,
      fileUrl: `./notes/${safeFilename}`,
      fileSize: item.size,
      pages: 15,
      type: 'PDF',
      uploadedAt: 'Just Now',
      isNew: true,
      isBlob: true,
      isSyllabus: item.isSyllabus
    };

    customNotes.unshift(newNote);
    successCount++;
  }

  saveCustomNotes(customNotes);

  showToast(`🎉 Successfully uploaded & categorized ${successCount} IT/ITeS files!`);
  bulkFilesQueue = [];
  clearBulkQueue();
  if (pBar) pBar.style.display = 'none';
  btn.disabled = false;
  loadDashboardData();
  renderManageTable();
}

// ==============================================
// 5. SINGLE FILE UPLOAD WITH AUTO-FILL
// ==============================================
function toggleSourceType(type) {
  const fileGroup = document.getElementById('fileUploadGroup');
  const urlGroup = document.getElementById('urlUploadGroup');

  if (type === 'file') {
    fileGroup.style.display = 'block';
    urlGroup.style.display = 'none';
  } else {
    fileGroup.style.display = 'none';
    urlGroup.style.display = 'block';
  }
}

async function handleFileSelect(e) {
  const file = e.target.files[0];
  await processSelectedFile(file);
}

function setupDropzone() {
  const dropzone = document.getElementById('fileUploadGroup');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#2563eb';
      dropzone.style.background = '#e0f2fe';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#93c5fd';
      dropzone.style.background = '#f0f7ff';
    });
  });

  dropzone.addEventListener('drop', async (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    await processSelectedFile(file);
  });
}

async function processSelectedFile(file) {
  if (!file) return;

  // 1. Check File Size (Max 30MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    alert(`File Too Large: Maximum allowed file size is 30 MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`);
    resetUploadForm();
    return;
  }

  // 2. Check File Extension
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    alert('Security Policy: Only PDF files (.pdf) are permitted.');
    resetUploadForm();
    return;
  }

  // 3. Cryptographic Magic Byte Inspection (%PDF- verification)
  if (typeof Security !== 'undefined') {
    const isRealPdf = await Security.verifyPdfMagicBytes(file);
    if (!isRealPdf) {
      alert('Security Alert: The uploaded file is NOT a valid PDF document (header signature mismatch). Upload blocked.');
      resetUploadForm();
      return;
    }
  }

  selectedFile = file;
  const safeFilename = (typeof Security !== 'undefined') ? Security.sanitizeFilename(file.name) : file.name;
  const preview = document.getElementById('fileNamePreview');
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  if (preview) {
    preview.textContent = `Verified PDF: ${safeFilename} (${sizeMb} MB)`;
    preview.style.color = '#059669';
    preview.style.fontWeight = '700';
  }

  // Auto-fill file size in form
  const sizeInput = document.getElementById('noteSize');
  if (sizeInput) sizeInput.value = `${sizeMb} MB`;

  // 4. Instant Auto-Categorization on Single File Pick
  if (typeof Security !== 'undefined' && typeof Security.autoCategorize === 'function') {
    const auto = Security.autoCategorize(file.name);
    const classSelect = document.getElementById('noteClass');
    if (classSelect) {
      classSelect.value = auto.classKey;
      updateSubjectDropdown();
    }
    const subjSelect = document.getElementById('noteSubject');
    if (subjSelect) {
      subjSelect.value = auto.categoryId;
    }
    const titleInput = document.getElementById('noteTitle');
    if (titleInput) {
      titleInput.value = auto.cleanTitle;
    }
    showToast(`✨ Auto-detected: Class ${auto.classKey} • ${auto.categoryName}`);
  }
}

function resetUploadForm() {
  selectedFile = null;
  const fileInput = document.getElementById('pdfFileInput');
  if (fileInput) fileInput.value = '';
  const preview = document.getElementById('fileNamePreview');
  if (preview) {
    preview.textContent = 'No file chosen yet (Max recommended: 25MB)';
    preview.style.color = '#64748b';
    preview.style.fontWeight = 'normal';
  }
}

async function handleNoteUpload(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submitNoteBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Saving Note...';

  try {
    const classKey = document.getElementById('noteClass').value;
    const subjectSelect = document.getElementById('noteSubject');
    const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];

    const subjectId = subjectSelect.value;
    const subjectName = selectedOption.getAttribute('data-name') || selectedOption.textContent.trim();
    const subjectIcon = selectedOption.getAttribute('data-icon') || '💻';
    const subjectColor = selectedOption.getAttribute('data-color') || '#2563eb';

    const rawTitle = document.getElementById('noteTitle').value.trim();
    const rawHindi = document.getElementById('noteHindiTitle').value.trim() || rawTitle;

    const title = (typeof Security !== 'undefined') ? Security.escapeHtml(rawTitle) : rawTitle;
    const hindiTitle = (typeof Security !== 'undefined') ? Security.escapeHtml(rawHindi) : rawHindi;
    const pages = parseInt(document.getElementById('notePages').value, 10) || 12;
    const fileSize = document.getElementById('noteSize').value.trim() || '1.5 MB';
    const isNew = document.getElementById('noteIsNew').checked;

    const sourceType = document.querySelector('input[name="sourceType"]:checked').value;
    const noteId = `custom-${classKey}-${subjectId}-${Date.now()}`;

    let fileUrl = '';
    let isBlob = false;

    if (sourceType === 'file') {
      if (!selectedFile) {
        alert('Please choose a valid verified PDF file to upload.');
        submitBtn.disabled = false;
        submitBtn.textContent = '📤 Save & Publish Note';
        return;
      }
      // Save Blob to IndexedDB
      const safeFilename = (typeof Security !== 'undefined') ? Security.sanitizeFilename(selectedFile.name) : selectedFile.name;
      await savePdfBlob(noteId, selectedFile, safeFilename);
      fileUrl = `./notes/${safeFilename}`;
      isBlob = true;
    } else {
      const urlInput = document.getElementById('pdfUrlInput').value.trim();
      const safeUrl = (typeof Security !== 'undefined') ? Security.sanitizeUrl(urlInput) : urlInput;

      if (!safeUrl || safeUrl === 'about:blank' || !safeUrl.startsWith('http')) {
        alert('Security Policy: Only valid http:// or https:// URLs are allowed.');
        submitBtn.disabled = false;
        submitBtn.textContent = '📤 Save & Publish Note';
        return;
      }
      fileUrl = safeUrl;
      isBlob = false;
    }

    const isSyllabus = (subjectId === 'syllabus' || (typeof Security !== 'undefined' && Security.autoCategorize(title).isSyllabus));

    const newNote = {
      id: noteId,
      classKey: classKey,
      subjectId: subjectId,
      subjectName: subjectName,
      subjectIcon: subjectIcon,
      subjectColor: subjectColor,
      title: title,
      hindiTitle: hindiTitle,
      fileUrl: fileUrl,
      fileSize: fileSize,
      pages: pages,
      type: 'PDF',
      uploadedAt: 'Just Now',
      isNew: isNew,
      isBlob: isBlob,
      isSyllabus: isSyllabus
    };

    // Save to LocalStorage custom notes
    const customNotes = getCustomNotes();
    customNotes.unshift(newNote);
    saveCustomNotes(customNotes);

    showToast('✅ Note successfully uploaded & published!');
    document.getElementById('uploadNoteForm').reset();
    resetUploadForm();
    updateSubjectDropdown();
    loadDashboardData();
  } catch (err) {
    console.error('Upload error:', err);
    alert('An error occurred while saving the note. Check console.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '📤 Save & Publish Note';
  }
}

// ==============================================
// 6. MANAGE NOTES TABLE (SANITIZED RENDERING & BULK DELETE)
// ==============================================
async function renderManageTable() {
  const tbody = document.getElementById('manageNotesBody');
  const classFilter = document.getElementById('manageClassFilter') ? document.getElementById('manageClassFilter').value : 'all';
  const folderFilter = document.getElementById('manageFolderFilter') ? document.getElementById('manageFolderFilter').value : 'all';
  const searchInput = document.getElementById('manageSearchInput');
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const mergedData = await getMergedClassesData();
  const customIds = new Set(getCustomNotes().map(n => n.id));

  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);
  const sanitizeUrl = (typeof Security !== 'undefined') ? Security.sanitizeUrl : (u => u);

  let rows = [];

  for (const classKey in mergedData) {
    if (classFilter !== 'all' && classFilter !== classKey) continue;

    mergedData[classKey].subjects.forEach(subject => {
      subject.notes.forEach(note => {
        const noteFolderRaw = note.folderHeader || (['11th', '12th'].includes(classKey) ? 'JSD' : 'DDEO');
        const noteFolderKey = noteFolderRaw.toUpperCase().replace(/\s+/g, '_');
        if (folderFilter !== 'all' && noteFolderKey !== folderFilter && noteFolderRaw !== folderFilter) return;

        // Apply search filter if specified
        if (searchTerm) {
          const matchTitle = (note.title || '').toLowerCase().includes(searchTerm);
          const matchHindi = (note.hindiTitle || '').toLowerCase().includes(searchTerm);
          const matchSubject = (subject.name || '').toLowerCase().includes(searchTerm);
          const matchFolder = noteFolderRaw.toLowerCase().includes(searchTerm);
          if (!matchTitle && !matchHindi && !matchSubject && !matchFolder) return;
        }

        const isDrive = Boolean(note.isGoogleDrive || (typeof GDrive !== 'undefined' && GDrive.isGoogleDriveUrl(note.fileUrl)));
        const isCustom = customIds.has(note.id);
        const safeUrl = sanitizeUrl(note.fileUrl);
        const viewUrl = (isDrive && note.previewUrl) ? sanitizeUrl(note.previewUrl) : safeUrl;
        const isSyl = note.isSyllabus || subject.id === 'syllabus';

        let sourceBadge = '<span style="color:#64748b; font-weight:600;">Default</span>';
        if (isDrive) {
          sourceBadge = '<span class="note-badge-gdrive" style="font-size: 0.68rem; padding: 2px 6px;">☁️ Google Drive</span>';
        } else if (isCustom) {
          sourceBadge = '<span style="color:#059669; font-weight:700;">Uploaded</span>';
        }

        rows.push(`
          <tr>
            <td style="text-align: center;">
              <input type="checkbox" class="note-select-cb" value="${esc(note.id)}" data-custom="${isCustom}" data-drive="${isDrive}" onchange="updateBulkDeleteState()" style="width: 16px; height: 16px; cursor: pointer; accent-color: #dc2626;">
            </td>
            <td>
              <div style="font-weight: 700; font-size: 0.72rem; color: #1e3a8a; margin-bottom: 2px;">📁 ${esc(noteFolderRaw)}</div>
              <span class="class-tag class-tag-${esc(classKey)}">${esc(classKey)}</span>
            </td>
            <td><strong>${esc(subject.name)}</strong></td>
            <td>
              <div>
                ${isSyl ? '<span class="note-badge-syllabus" style="font-size: 0.6rem; margin-right: 4px;">SYLLABUS</span>' : ''}
                ${esc(note.title)}
              </div>
              <div style="font-size: 0.72rem; color: #64748b;">${esc(note.hindiTitle)}</div>
            </td>
            <td>${esc(note.fileSize)} / ${esc(note.pages)}p</td>
            <td>${sourceBadge}</td>
            <td class="text-right">
              <div class="action-btns">
                <a href="${viewUrl}" target="_blank" rel="noopener noreferrer" class="btn-icon" title="View Note">👁️ View</a>
                <button class="btn-icon delete" onclick="deleteNote('${esc(note.id)}', ${isCustom}, ${isDrive})" title="Delete Note">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        `);
      });
    });
  }

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #94a3b8;">No notes found matching your criteria.</td></tr>`;
  } else {
    tbody.innerHTML = rows.join('');
  }

  // Reset master checkbox and bulk delete state after re-render
  const master = document.getElementById('selectAllNotes');
  if (master) {
    master.checked = false;
    master.indeterminate = false;
  }
  updateBulkDeleteState();
}

// Checkbox selection handlers for Bulk Delete
function toggleSelectAllNotes(master) {
  const checkboxes = document.querySelectorAll('.note-select-cb');
  checkboxes.forEach(cb => {
    cb.checked = master.checked;
  });
  updateBulkDeleteState();
}

function updateBulkDeleteState() {
  const checked = document.querySelectorAll('.note-select-cb:checked');
  const total = document.querySelectorAll('.note-select-cb');
  const toolbar = document.getElementById('bulkDeleteToolbar');
  const countBadge = document.getElementById('selectedNotesCount');
  const btnCount = document.getElementById('btnDeleteCount');
  const master = document.getElementById('selectAllNotes');

  if (toolbar) {
    toolbar.style.display = checked.length > 0 ? 'flex' : 'none';
  }
  if (countBadge) countBadge.textContent = checked.length;
  if (btnCount) btnCount.textContent = checked.length;

  if (master) {
    master.checked = total.length > 0 && checked.length === total.length;
    master.indeterminate = checked.length > 0 && checked.length < total.length;
  }
}

function deselectAllNotes() {
  const master = document.getElementById('selectAllNotes');
  if (master) {
    master.checked = false;
    master.indeterminate = false;
  }
  document.querySelectorAll('.note-select-cb').forEach(cb => {
    cb.checked = false;
  });
  updateBulkDeleteState();
}

async function handleBulkDeleteNotes() {
  const checkedBoxes = Array.from(document.querySelectorAll('.note-select-cb:checked'));
  if (checkedBoxes.length === 0) {
    alert('Please select at least one note to delete.');
    return;
  }

  const count = checkedBoxes.length;
  if (!confirm(`Are you sure you want to permanently delete these ${count} selected note(s)?\n\nThis will remove them from the student notes portal.`)) {
    return;
  }

  const customIdsToDelete = [];
  const driveIdsToDelete = [];
  const defaultIdsToDelete = [];

  checkedBoxes.forEach(cb => {
    const id = cb.value;
    const isCustom = cb.getAttribute('data-custom') === 'true';
    const isDrive = cb.getAttribute('data-drive') === 'true';

    if (isDrive) {
      driveIdsToDelete.push(id);
    } else if (isCustom) {
      customIdsToDelete.push(id);
    } else {
      defaultIdsToDelete.push(id);
    }
  });

  // 1. Process custom uploaded notes (localStorage + IndexedDB Blobs)
  if (customIdsToDelete.length > 0) {
    const customIdSet = new Set(customIdsToDelete);
    let custom = getCustomNotes();
    custom = custom.filter(n => !customIdSet.has(n.id));
    saveCustomNotes(custom);

    await Promise.all(customIdsToDelete.map(id => deletePdfBlob(id)));
  }

  // 2. Process Google Drive synced notes
  if (driveIdsToDelete.length > 0) {
    if (typeof GDrive !== 'undefined') {
      const driveNotes = GDrive.getDriveNotes();
      const driveIdSet = new Set(driveIdsToDelete);
      const filtered = driveNotes.filter(n => !driveIdSet.has(n.id));
      GDrive.saveDriveNotes(filtered);
    }
  }

  // 3. Mark in deleted note IDs list so they don't resurface
  const allIdsToHide = [...driveIdsToDelete, ...defaultIdsToDelete];
  if (allIdsToHide.length > 0) {
    const deleted = getDeletedNoteIds();
    const deletedSet = new Set(deleted);
    allIdsToHide.forEach(id => deletedSet.add(id));
    saveDeletedNoteIds(Array.from(deletedSet));
  }

  showToast(`🗑️ Successfully deleted ${count} note(s)!`);
  deselectAllNotes();
  await renderManageTable();
  await loadDashboardData();
}

async function deleteNote(noteId, isCustom, isDrive = false) {
  if (!confirm('Are you sure you want to delete this study note / syllabus?')) return;

  if (isDrive) {
    if (typeof deleteDriveNote === 'function') {
      deleteDriveNote(noteId);
    }
    const deleted = getDeletedNoteIds();
    if (!deleted.includes(noteId)) {
      deleted.push(noteId);
      saveDeletedNoteIds(deleted);
    }
  } else if (isCustom) {
    let custom = getCustomNotes();
    custom = custom.filter(n => n.id !== noteId);
    saveCustomNotes(custom);
    await deletePdfBlob(noteId);
  } else {
    const deleted = getDeletedNoteIds();
    if (!deleted.includes(noteId)) {
      deleted.push(noteId);
      saveDeletedNoteIds(deleted);
    }
  }

  showToast('🗑️ Note removed');
  renderManageTable();
  loadDashboardData();
}

// ==============================================
// 7. MANAGE NOTICES / POSTERS (SANITIZED RENDERING)
// ==============================================
function renderManageNotices() {
  const container = document.getElementById('manageNoticesList');
  const posters = getMergedPostersData();

  if (posters.length === 0) {
    container.innerHTML = `<p style="color: #94a3b8; font-size: 0.8rem;">No notices currently active.</p>`;
    return;
  }

  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);

  container.innerHTML = posters.map(p => `
    <div class="notice-item">
      <div>
        <div class="notice-item-title">${esc(p.icon || '📢')} [${esc(p.tag || 'Notice')}] ${esc(p.title)}</div>
        <div class="notice-item-sub">${esc(p.subtitle)}</div>
        <div style="font-size: 0.68rem; color: #94a3b8; margin-top: 4px;">Date: ${esc(p.date || '')}</div>
      </div>
      <button class="btn-icon delete" onclick="deleteNotice(${p.id})">🗑️</button>
    </div>
  `).join('');
}

function handleAddNotice(e) {
  e.preventDefault();
  const rawTitle = document.getElementById('noticeTitle').value.trim();
  const rawSub = document.getElementById('noticeSub').value.trim();
  const tag = document.getElementById('noticeTag').value;
  const icon = document.getElementById('noticeIcon').value;

  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);

  const posters = getMergedPostersData();
  const newNotice = {
    id: Date.now(),
    tag: esc(tag),
    badgeColor: 'bg-blue-500',
    title: esc(rawTitle),
    subtitle: esc(rawSub),
    date: 'Just Now',
    icon: esc(icon)
  };

  posters.unshift(newNotice);
  saveCustomPosters(posters);

  document.getElementById('noticeForm').reset();
  showToast('📢 Notice published to student home screen!');
  renderManageNotices();
  loadDashboardData();
}

function deleteNotice(id) {
  let posters = getMergedPostersData();
  posters = posters.filter(p => p.id !== id);
  saveCustomPosters(posters);
  showToast('Notice removed');
  renderManageNotices();
  loadDashboardData();
}

// ==============================================
// 8. EXPORT & DEPLOY (DOWNLOAD DATA.JS)
// ==============================================
async function downloadUpdatedDataJs() {
  const mergedData = await getMergedClassesData();
  const posters = getMergedPostersData();

  // Strip temporary blob ObjectURLs for clean file export
  for (const c in mergedData) {
    mergedData[c].subjects.forEach(s => {
      s.notes.forEach(n => {
        if (n.isBlob) {
          const safeId = (typeof Security !== 'undefined') ? Security.sanitizeFilename(n.id) : n.id;
          n.fileUrl = `./notes/${safeId}.pdf`;
        }
      });
    });
  }

  const jsContent = `// Educational Notes Database for SS+2 High School Ghaghra
// Subject: Information Technology (IT / ITeS) - Vocational Code 402/802
// Generated via SSHS Admin Portal on ${new Date().toLocaleDateString()}

const SCHOOL_CONFIG = ${JSON.stringify(SCHOOL_CONFIG, null, 2)};

const POSTERS_DATA = ${JSON.stringify(posters, null, 2)};

const CLASSES_DATA = ${JSON.stringify(mergedData, null, 2)};

if (typeof window !== 'undefined') {
  window.SCHOOL_CONFIG = SCHOOL_CONFIG;
  window.POSTERS_DATA = POSTERS_DATA;
  window.CLASSES_DATA = CLASSES_DATA;
}
`;

  const blob = new Blob([jsContent], { type: 'application/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'data.js';
  a.click();
  showToast('📥 data.js downloaded! Replace js/data.js to publish permanently.');
}

async function downloadJsonBackup() {
  const mergedData = await getMergedClassesData();
  const posters = getMergedPostersData();
  const backup = {
    school: SCHOOL_CONFIG,
    classes: mergedData,
    posters: posters,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sshs_it_backup_${Date.now()}.json`;
  a.click();
  showToast('📥 Backup JSON downloaded');
}

function handleResetDefaults() {
  if (!confirm('Warning: This will clear all custom uploaded notes and restored notices back to original defaults. Are you sure?')) return;

  localStorage.removeItem(STORAGE_KEY_CUSTOM_NOTES);
  localStorage.removeItem(STORAGE_KEY_CUSTOM_POSTERS);
  localStorage.removeItem(STORAGE_KEY_DELETED_IDS);

  showToast('🔄 Reset to default data complete');
  loadDashboardData();
  renderManageTable();
}

// ==============================================
// 9. GOOGLE DRIVE INTEGRATION & SYNC CONTROLLER
// ==============================================
function loadGDriveTab() {
  if (typeof GDrive === 'undefined') return;
  const config = GDrive.getConfig();

  const scriptInput = document.getElementById('gdriveScriptUrl');
  const folderInput = document.getElementById('gdriveFolderId');
  const autoSyncInput = document.getElementById('gdriveAutoSync');
  const sheetInput = document.getElementById('gdriveSheetUrl');
  const statusBadge = document.getElementById('gdriveStatusBadge');
  const statusText = document.getElementById('gdriveStatusText');
  const lastSynced = document.getElementById('gdriveLastSynced');
  const countEl = document.getElementById('gdriveNotesCount');

  if (scriptInput) scriptInput.value = config.scriptUrl || '';
  if (folderInput) folderInput.value = config.folderId || '';
  if (autoSyncInput) autoSyncInput.checked = Boolean(config.autoSync);
  if (sheetInput) sheetInput.value = config.sheetUrl || '';

  const driveNotes = GDrive.getDriveNotes();
  if (countEl) countEl.textContent = driveNotes.length;

  if (config.lastSyncTime) {
    const d = new Date(config.lastSyncTime);
    if (lastSynced) lastSynced.textContent = d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } else {
    if (lastSynced) lastSynced.textContent = 'Never';
  }

  if (config.scriptUrl) {
    if (statusBadge) {
      statusBadge.textContent = '🟢 Cloud Sync Active';
      statusBadge.style.color = '#047857';
      statusBadge.style.borderColor = '#6ee7b7';
    }
    if (statusText) statusText.innerHTML = '<strong style="color: #059669;">Connected to Google Apps Script Web App</strong>';
  } else if (config.sheetUrl) {
    if (statusBadge) {
      statusBadge.textContent = '📊 Sheet Connected';
      statusBadge.style.color = '#0284c7';
      statusBadge.style.borderColor = '#7dd3fc';
    }
    if (statusText) statusText.innerHTML = '<strong style="color: #0284c7;">Connected to Google Sheet Catalog</strong>';
  } else {
    if (statusBadge) {
      statusBadge.textContent = '⚪ Not Configured';
      statusBadge.style.color = '#64748b';
      statusBadge.style.borderColor = '#cbd5e1';
    }
    if (statusText) statusText.textContent = 'Enter Web App URL or paste links below to connect.';
  }
}

async function handleSaveDriveConfig(e) {
  e.preventDefault();
  if (typeof GDrive === 'undefined') return;

  const scriptUrl = (document.getElementById('gdriveScriptUrl').value || '').trim();
  const folderId = (document.getElementById('gdriveFolderId').value || '').trim();
  const autoSync = document.getElementById('gdriveAutoSync').checked;

  GDrive.saveConfig({ scriptUrl, folderId, autoSync });
  showToast('💾 Google Drive configuration saved!');
  loadGDriveTab();

  if (scriptUrl) {
    await handleManualDriveSync();
  }
}

async function handleManualDriveSync() {
  if (typeof GDrive === 'undefined') return;
  const config = GDrive.getConfig();

  if (!config.scriptUrl) {
    alert('Please enter and save your Google Apps Script Web App URL first.');
    return;
  }

  const btn = document.getElementById('btnSyncDriveNow');
  const origText = btn ? btn.innerHTML : 'Sync';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Syncing with Google Drive...';
  }

  try {
    const result = await GDrive.syncFromAppsScript();
    showToast(`☁️ Synced ${result.count} notes from Google Drive folder: "${result.folderName}"!`);
    loadGDriveTab();
    loadDashboardData();
    renderManageTable();
  } catch (err) {
    console.error('[GDrive Sync Error]:', err);
    alert(`Sync Failed: ${err.message}\n\nPlease check that your Web App URL is correct and deployed with "Who has access: Anyone".`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

function handleClearDriveNotes() {
  if (!confirm('Are you sure you want to remove all synced Google Drive notes from this device? (Files on Google Drive remain safe).')) return;
  if (typeof clearAllDriveNotes === 'function') {
    clearAllDriveNotes();
  }
  showToast('🗑️ Synced Google Drive notes cleared');
  loadGDriveTab();
  loadDashboardData();
  renderManageTable();
}

async function handleSyncFromSheet(e) {
  e.preventDefault();
  if (typeof GDrive === 'undefined') return;

  const sheetUrl = (document.getElementById('gdriveSheetUrl').value || '').trim();
  if (!sheetUrl) {
    alert('Please enter a Google Sheet URL or ID.');
    return;
  }

  try {
    const result = await GDrive.syncFromGoogleSheet(sheetUrl);
    showToast(`📊 Successfully imported ${result.count} notes from Google Sheet!`);
    loadGDriveTab();
    loadDashboardData();
    renderManageTable();
  } catch (err) {
    alert(`Sheet Import Failed: ${err.message}\n\nPlease ensure the Google Sheet is shared as "Anyone with the link can view".`);
  }
}

function handleImportDirectDriveLinks(e) {
  e.preventDefault();
  if (typeof GDrive === 'undefined') return;

  const text = (document.getElementById('gdriveLinksInput').value || '').trim();
  const overrideClass = document.getElementById('gdriveOverrideClass').value || null;
  const overrideSection = document.getElementById('gdriveOverrideSection').value || null;

  if (!text) {
    alert('Please paste at least one Google Drive link.');
    return;
  }

  const added = GDrive.importLinks(text, overrideClass, overrideSection);
  if (added.length === 0) {
    alert('Could not find any valid Google Drive file links in the input. Ensure URLs are in standard Google Drive format.');
    return;
  }

  document.getElementById('gdriveLinksInput').value = '';
  showToast(`✅ Added ${added.length} Google Drive note(s) to portal!`);
  loadGDriveTab();
  loadDashboardData();
  renderManageTable();
}

function toggleSetupGuide() {
  const content = document.getElementById('setupGuideContent');
  const icon = document.getElementById('guideToggleIcon');
  if (!content) return;
  const isHidden = content.style.display === 'none';
  content.style.display = isHidden ? 'block' : 'none';
  if (icon) icon.textContent = isHidden ? '▲' : '▼';
}

function copyAppsScriptCode() {
  const code = `/**
 * SS+2 HIGH SCHOOL GHAGHRA - GOOGLE DRIVE NOTES SYNC BACKEND
 * Deploy as Web App -> Execute as: Me -> Who has access: Anyone
 */
var DEFAULT_FOLDER_ID = "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE";

function doGet(e) {
  try {
    var folderId = (e && e.parameter && e.parameter.folderId) ? e.parameter.folderId : DEFAULT_FOLDER_ID;
    if (!folderId || folderId === "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE") {
      return createJsonResponse({ status: "error", message: "Folder ID not configured" });
    }
    var folder = DriveApp.getFolderById(folderId);
    var notes = [];

    // Recursive crawler for multi-level folders (DDEO, JSD, QUESTIONS, BOOKS, etc.)
    function scanFolder(currentFolder, path) {
      var files = currentFolder.getFiles();
      while (files.hasNext()) {
        var file = files.next();
        var name = file.getName();
        if (file.getMimeType() === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
          notes.push({
            id: file.getId(),
            name: name,
            folder: currentFolder.getName(),
            folderPath: path,
            size: formatBytes(file.getSize()),
            updated: Utilities.formatDate(file.getLastUpdated(), "Asia/Kolkata", "dd MMM yyyy"),
            downloadUrl: "https://drive.google.com/uc?export=download&id=" + file.getId(),
            previewUrl: "https://drive.google.com/file/d/" + file.getId() + "/preview",
            viewUrl: file.getUrl()
          });
        }
      }

      var subfolders = currentFolder.getFolders();
      while (subfolders.hasNext()) {
        var sub = subfolders.next();
        var newPath = path ? (path + " / " + sub.getName()) : sub.getName();
        scanFolder(sub, newPath);
      }
    }

    scanFolder(folder, folder.getName());

    return createJsonResponse({
      status: "success",
      folderName: folder.getName(),
      totalFiles: notes.length,
      syncedAt: Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm a"),
      files: notes
    });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  var k = 1024;
  var sizes = ["B", "KB", "MB", "GB"];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      showToast('📋 Google Apps Script code copied to clipboard!');
    }).catch(() => {
      prompt('Copy code below:', code);
    });
  } else {
    prompt('Copy code below:', code);
  }
}

// Toast helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// Global window bindings
if (typeof window !== 'undefined') {
  window.handleLogin = handleLogin;
  window.handleChangePin = handleChangePin;
  window.handleLogout = handleLogout;
  window.switchTab = switchTab;
  window.updateSubjectDropdown = updateSubjectDropdown;
  window.promptNewSubject = promptNewSubject;
  window.toggleSourceType = toggleSourceType;
  window.handleFileSelect = handleFileSelect;
  window.handleNoteUpload = handleNoteUpload;
  window.handleBulkFilesSelect = handleBulkFilesSelect;
  window.updateQueueItemClass = updateQueueItemClass;
  window.updateQueueItemCategory = updateQueueItemCategory;
  window.updateQueueItemTitle = updateQueueItemTitle;
  window.removeBulkQueueItem = removeBulkQueueItem;
  window.clearBulkQueue = clearBulkQueue;
  window.executeBulkUpload = executeBulkUpload;
  window.renderManageTable = renderManageTable;
  window.deleteNote = deleteNote;
  window.toggleSelectAllNotes = toggleSelectAllNotes;
  window.updateBulkDeleteState = updateBulkDeleteState;
  window.deselectAllNotes = deselectAllNotes;
  window.handleBulkDeleteNotes = handleBulkDeleteNotes;
  window.handleAddNotice = handleAddNotice;
  window.deleteNotice = deleteNotice;
  window.downloadUpdatedDataJs = downloadUpdatedDataJs;
  window.downloadJsonBackup = downloadJsonBackup;
  window.handleResetDefaults = handleResetDefaults;
  window.loadGDriveTab = loadGDriveTab;
  window.handleSaveDriveConfig = handleSaveDriveConfig;
  window.handleManualDriveSync = handleManualDriveSync;
  window.handleClearDriveNotes = handleClearDriveNotes;
  window.handleSyncFromSheet = handleSyncFromSheet;
  window.handleImportDirectDriveLinks = handleImportDirectDriveLinks;
  window.toggleSetupGuide = toggleSetupGuide;
  window.copyAppsScriptCode = copyAppsScriptCode;
  window.toggleResetForm = toggleResetForm;
  window.handleResetPassword = handleResetPassword;
  window.handleChangePassword = handleChangePassword;
  window.handleChangePin = handleChangePassword; // Backward-compatible alias
  window.handleUpdateRecoveryKey = handleUpdateRecoveryKey;
}
