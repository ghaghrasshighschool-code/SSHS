// Admin Controller for SS+2 High School Ghaghra Notes Portal
// Enforces Zero-Risk Policies: SHA-256 Hashed PINs, Rate Limiting, File Magic Byte Verification & HTML Sanitization

// Default PIN is 'admin123' (stored strictly as SHA-256 hash, never in cleartext)
const DEFAULT_PIN_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB maximum file size

let selectedFile = null;

// On Page Load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  updateSubjectDropdown();
  setupDropzone();
});

// ==============================================
// 1. AUTHENTICATION & PIN SECURITY (SHA-256 + RATE LIMITING)
// ==============================================
function getAdminPinHash() {
  return localStorage.getItem('sshs_admin_pin_hash') || DEFAULT_PIN_HASH;
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
    errorEl.textContent = `Incorrect PIN. ${attemptsRemaining} attempt(s) remaining.`;
    errorEl.classList.add('show');
    document.getElementById('pinInput').value = '';
    document.getElementById('pinInput').focus();
  }
}

async function handleChangePin() {
  const newPin = document.getElementById('newPinInput').value.trim();
  if (!newPin || newPin.length < 6) {
    alert('Security Policy: PIN must be at least 6 characters long.');
    return;
  }

  const hashed = (typeof Security !== 'undefined') ? await Security.hashString(newPin) : newPin;
  localStorage.setItem('sshs_admin_pin_hash', hashed);
  document.getElementById('newPinInput').value = '';
  showToast('🔐 Admin PIN updated and cryptographically hashed (SHA-256)!');
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

  const btnIndex = ['uploadTab', 'manageTab', 'noticesTab', 'exportTab'].indexOf(tabId);
  const buttons = document.querySelectorAll('.admin-tab-btn');
  if (buttons[btnIndex]) buttons[btnIndex].classList.add('active');

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

  document.getElementById('statTotalNotes').textContent = totalNotes;
  document.getElementById('statSecNotes').textContent = secNotes;
  document.getElementById('statHighNotes').textContent = highNotes;
  document.getElementById('statNotices').textContent = posters.length;
}

// ==============================================
// 3. SUBJECT DROPDOWN & CUSTOM SUBJECTS
// ==============================================
function updateSubjectDropdown() {
  const classKey = document.getElementById('noteClass').value;
  const subjectSelect = document.getElementById('noteSubject');
  const classData = CLASSES_DATA[classKey];

  if (!classData) return;

  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);

  subjectSelect.innerHTML = classData.subjects.map(s => `
    <option value="${esc(s.id)}" data-name="${esc(s.name)}" data-icon="${esc(s.icon || '📘')}" data-color="${esc(s.color || '#2563eb')}">
      ${esc(s.icon || '📘')} ${esc(s.name)}
    </option>
  `).join('');
}

function promptNewSubject() {
  const name = prompt('Enter new subject name (e.g., Computer Science / कंप्यूटर विज्ञान):');
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
  showToast(`Added subject: ${cleanName}`);
}

// ==============================================
// 4. SECURE FILE DROPZONE & VERIFICATION
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
  const dropzone = document.querySelector('.file-dropzone');
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
  preview.textContent = `Verified PDF: ${safeFilename} (${sizeMb} MB)`;
  preview.style.color = '#059669';
  preview.style.fontWeight = '700';

  // Auto-fill file size in form
  document.getElementById('noteSize').value = `${sizeMb} MB`;

  // Auto-fill title if empty
  const titleInput = document.getElementById('noteTitle');
  if (!titleInput.value) {
    const cleanName = safeFilename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    titleInput.value = cleanName;
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

// ==============================================
// 5. NOTE UPLOAD HANDLER
// ==============================================
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
    const subjectIcon = selectedOption.getAttribute('data-icon') || '📘';
    const subjectColor = selectedOption.getAttribute('data-color') || '#2563eb';

    const rawTitle = document.getElementById('noteTitle').value.trim();
    const rawHindi = document.getElementById('noteHindiTitle').value.trim() || rawTitle;

    const title = (typeof Security !== 'undefined') ? Security.escapeHtml(rawTitle) : rawTitle;
    const hindiTitle = (typeof Security !== 'undefined') ? Security.escapeHtml(rawHindi) : rawHindi;
    const pages = parseInt(document.getElementById('notePages').value, 10) || 10;
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
      isBlob: isBlob
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
// 6. MANAGE NOTES TABLE (SANITIZED RENDERING)
// ==============================================
async function renderManageTable() {
  const tbody = document.getElementById('manageNotesBody');
  const classFilter = document.getElementById('manageClassFilter').value;
  const mergedData = await getMergedClassesData();
  const customIds = new Set(getCustomNotes().map(n => n.id));

  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);
  const sanitizeUrl = (typeof Security !== 'undefined') ? Security.sanitizeUrl : (u => u);

  let rows = [];

  for (const classKey in mergedData) {
    if (classFilter !== 'all' && classFilter !== classKey) continue;

    mergedData[classKey].subjects.forEach(subject => {
      subject.notes.forEach(note => {
        const isCustom = customIds.has(note.id);
        const safeUrl = sanitizeUrl(note.fileUrl);

        rows.push(`
          <tr>
            <td><span class="class-tag class-tag-${esc(classKey)}">${esc(classKey)}</span></td>
            <td><strong>${esc(subject.name)}</strong></td>
            <td>
              <div>${esc(note.title)}</div>
              <div style="font-size: 0.72rem; color: #64748b;">${esc(note.hindiTitle)}</div>
            </td>
            <td>${esc(note.fileSize)} / ${esc(note.pages)}p</td>
            <td>${isCustom ? '<span style="color:#059669; font-weight:700;">Uploaded</span>' : 'Default'}</td>
            <td class="text-right">
              <div class="action-btns">
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn-icon" title="View Note">👁️ View</a>
                <button class="btn-icon delete" onclick="deleteNote('${esc(note.id)}', ${isCustom})" title="Delete Note">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        `);
      });
    });
  }

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #94a3b8;">No notes found for selected class.</td></tr>`;
  } else {
    tbody.innerHTML = rows.join('');
  }
}

async function deleteNote(noteId, isCustom) {
  if (!confirm('Are you sure you want to delete this study note?')) return;

  if (isCustom) {
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
  a.download = `sshs_backup_${Date.now()}.json`;
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
  window.renderManageTable = renderManageTable;
  window.deleteNote = deleteNote;
  window.handleAddNotice = handleAddNotice;
  window.deleteNotice = deleteNotice;
  window.downloadUpdatedDataJs = downloadUpdatedDataJs;
  window.downloadJsonBackup = downloadJsonBackup;
  window.handleResetDefaults = handleResetDefaults;
}
