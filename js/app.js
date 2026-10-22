// Application Controller for SS+2 High School Ghaghra Notes App

let currentClass = '9th';
let currentSubject = 'all';
let currentSearch = '';
let appClassesData = (typeof window !== 'undefined' && window.CLASSES_DATA) 
  ? window.CLASSES_DATA 
  : (typeof CLASSES_DATA !== 'undefined' ? CLASSES_DATA : {});
const currentNotesMap = new Map();

// DOM Elements
const homeScreen = document.getElementById('homeScreen');
const notesScreen = document.getElementById('notesScreen');
const navBar = document.getElementById('navBar');
const mainHeader = document.getElementById('mainHeader');
const offlineBanner = document.getElementById('offlineBanner');
const posterContainer = document.getElementById('posterContainer');
const notesContainer = document.getElementById('notesContainer');
const subjectFilters = document.getElementById('subjectFilters');
const searchInput = document.getElementById('searchInput');
const classHeading = document.getElementById('classHeading');
const classSubheading = document.getElementById('classSubheading');
const pdfModal = document.getElementById('pdfModal');
const modalTitle = document.getElementById('modalTitle');
const modalFrame = document.getElementById('modalFrame');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');
const toast = document.getElementById('toast');

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  await reloadAllData();
  renderPosters();
  setupNetworkListeners();
  setupSearch();
  checkGoogleDriveSync();
});

// Auto-reload data when user switches back to this tab (e.g. from Admin portal)
window.addEventListener('focus', async () => {
  await reloadAllData();
  renderPosters();
  if (notesScreen && notesScreen.classList.contains('active')) {
    renderNotes();
  }
});

// Auto-sync Google Drive notes in background if configured and online
async function checkGoogleDriveSync() {
  if (typeof GDrive === 'undefined' || !navigator.onLine) return;
  const config = GDrive.getConfig();
  if (!config.autoSync || !config.scriptUrl) return;

  try {
    const result = await GDrive.syncFromAppsScript();
    if (result && result.count > 0) {
      console.log('[GDrive] Background auto-sync pulled', result.count, 'notes');
      await reloadAllData();
      if (notesScreen && notesScreen.classList.contains('active')) {
        renderNotes();
      }
    }
  } catch (e) {
    console.debug('[GDrive] Background auto-sync note:', e.message);
  }
}

async function reloadAllData() {
  try {
    if (typeof getMergedClassesData === 'function') {
      appClassesData = await getMergedClassesData();
    } else if (typeof window !== 'undefined' && window.CLASSES_DATA) {
      appClassesData = window.CLASSES_DATA;
    } else if (typeof CLASSES_DATA !== 'undefined') {
      appClassesData = CLASSES_DATA;
    }
  } catch (err) {
    console.error('Error reloading app data:', err);
    if (typeof CLASSES_DATA !== 'undefined') {
      appClassesData = CLASSES_DATA;
    }
  }
}

// Render Page 1 Posters / Notices
function renderPosters() {
  if (!posterContainer) return;
  const posters = (typeof getMergedPostersData === 'function') 
    ? getMergedPostersData() 
    : ((typeof window !== 'undefined' && window.POSTERS_DATA) ? window.POSTERS_DATA : (typeof POSTERS_DATA !== 'undefined' ? POSTERS_DATA : []));

  posterContainer.innerHTML = posters.map(p => {
    const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);
    return `
      <div class="poster-card">
        <div class="poster-icon">${esc(p.icon || '📢')}</div>
        <div class="poster-content">
          <div class="poster-item-title">${esc(p.title)}</div>
          <div class="poster-item-desc">${esc(p.subtitle)}</div>
          <div class="poster-item-footer">
            <span class="poster-item-tag">${esc(p.tag || 'Notice')}</span>
            <span class="poster-item-date">${esc(p.date || '')}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Select Class (Triggered by Diamond Quadrants or Quick Buttons)
async function selectClass(className) {
  // Always fetch latest merged data so newly synced Google Drive notes appear immediately
  await reloadAllData();

  const sourceData = (appClassesData && appClassesData[className])
    ? appClassesData
    : ((typeof window !== 'undefined' && window.CLASSES_DATA) ? window.CLASSES_DATA : (typeof CLASSES_DATA !== 'undefined' ? CLASSES_DATA : {}));

  if (!sourceData[className]) {
    console.warn('Class data not available for:', className);
    return;
  }

  currentClass = className;
  currentSubject = 'all';
  currentSearch = '';
  if (searchInput) searchInput.value = '';

  const classData = sourceData[className];
  if (classHeading) classHeading.textContent = `${classData.name} IT/ITeS Notes & Syllabus -`;
  if (classSubheading) classSubheading.textContent = `${classData.hindiName} • ${classData.description}`;

  renderSubjectFilters(classData);
  renderNotes();

  // Screen Transition: Home -> Notes
  if (homeScreen) homeScreen.classList.remove('active');
  if (notesScreen) notesScreen.classList.add('active');
  if (navBar) navBar.style.display = 'flex';
  if (mainHeader) mainHeader.style.display = 'none';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Back to Home Screen (Page 1)
function goHome() {
  if (notesScreen) notesScreen.classList.remove('active');
  if (homeScreen) homeScreen.classList.add('active');
  if (navBar) navBar.style.display = 'none';
  if (mainHeader) mainHeader.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Subject Filter Pills
function renderSubjectFilters(classData) {
  if (!subjectFilters || !classData || !classData.subjects) return;
  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);
  const pills = [
    `<button class="subject-pill ${currentSubject === 'all' ? 'active' : ''}" onclick="filterSubject('all')">📚 All Subjects</button>`,
    ...classData.subjects.map(s => `
      <button class="subject-pill ${currentSubject === s.id ? 'active' : ''}" onclick="filterSubject('${esc(s.id)}')">
        <span>${esc(s.icon || '📘')}</span> ${esc(s.name)}
      </button>
    `)
  ];
  subjectFilters.innerHTML = pills.join('');
}

// Filter Notes by Subject
function filterSubject(subjectId) {
  currentSubject = subjectId;
  const source = appClassesData || (typeof window !== 'undefined' && window.CLASSES_DATA) || CLASSES_DATA;
  const classData = source[currentClass];
  renderSubjectFilters(classData);
  renderNotes();
}

// Setup Real-time Search
function setupSearch() {
  if (!searchInput) return;
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    renderNotes();
  });
}

// Render Notes for Selected Class & Filter
function renderNotes() {
  if (!notesContainer) return;
  const source = appClassesData || (typeof window !== 'undefined' && window.CLASSES_DATA) || CLASSES_DATA;
  const classData = source ? source[currentClass] : null;
  if (!classData || !classData.subjects) return;

  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);
  const sanitizeUrl = (typeof Security !== 'undefined') ? Security.sanitizeUrl : (u => u);
  const sanitizeFilename = (typeof Security !== 'undefined') ? Security.sanitizeFilename : (f => f);

  let allNotes = [];

  classData.subjects.forEach(subject => {
    if (currentSubject === 'all' || currentSubject === subject.id) {
      subject.notes.forEach(note => {
        allNotes.push({
          ...note,
          subjectName: subject.name,
          subjectIcon: subject.icon,
          subjectColor: subject.color
        });
      });
    }
  });

  // Apply Search Filter (Null-safe)
  if (currentSearch) {
    allNotes = allNotes.filter(n =>
      ((n.title || '').toLowerCase().includes(currentSearch)) ||
      ((n.hindiTitle || '').toLowerCase().includes(currentSearch)) ||
      ((n.subjectName || '').toLowerCase().includes(currentSearch))
    );
  }

  if (allNotes.length === 0) {
    notesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p><strong>No notes found</strong></p>
        <p style="font-size: 0.8rem; margin-top: 4px;">Try searching for another chapter or topic.</p>
      </div>
    `;
    return;
  }

  // Priority Sort: Syllabus always placed at the very top
  allNotes.sort((a, b) => {
    const aSyl = (a.isSyllabus || a.subjectId === 'syllabus' || (a.id && a.id.includes('syl'))) ? 1 : 0;
    const bSyl = (b.isSyllabus || b.subjectId === 'syllabus' || (b.id && b.id.includes('syl'))) ? 1 : 0;
    return bSyl - aSyl;
  });

  // Store notes in currentNotesMap for quote-safe lookup
  currentNotesMap.clear();
  allNotes.forEach(n => currentNotesMap.set(String(n.id), n));

  notesContainer.innerHTML = allNotes.map((n, idx) => {
    const isDrive = Boolean(n.isGoogleDrive || (typeof GDrive !== 'undefined' && GDrive.isGoogleDriveUrl(n.fileUrl)));
    const safeUrl = sanitizeUrl(n.fileUrl);
    const safeId = sanitizeFilename(n.id || `note-${idx}`);
    const isSyl = n.isSyllabus || (n.subjectId === 'syllabus') || (n.id && n.id.includes('syl'));
    const safeNoteKey = esc(String(n.id || idx));
    return `
    <div class="note-card ${isSyl ? 'syllabus-card' : ''} ${isDrive ? 'gdrive-card' : ''}">
      <div class="note-card-top">
        <div>
          <div style="font-size: 0.72rem; font-weight: 700; color: ${esc(n.subjectColor || '#2563eb')}; margin-bottom: 2px;">
            ${esc(n.subjectIcon || '💻')} ${esc(n.subjectName || 'IT/ITeS Skills')}
          </div>
          <div class="note-title">${esc(n.title || 'Untitled Note')}</div>
          <div class="note-hindi-title">${esc(n.hindiTitle || '')}</div>
        </div>
        <div class="badge-stack">
          ${isDrive ? '<span class="note-badge-gdrive">☁️ DRIVE</span>' : ''}
          ${isSyl ? '<span class="note-badge-syllabus">📋 OFFICIAL SYLLABUS</span>' : (n.isNew ? '<span class="note-badge">NEW</span>' : '')}
        </div>
      </div>

      <div class="note-meta">
        <span class="note-meta-item">📄 ${esc(n.pages || 'PDF')} Pages</span>
        <span class="note-meta-item">💾 ${esc(n.fileSize || 'Google Drive')}</span>
        <span class="note-meta-item">📅 ${esc(n.uploadedAt || 'Synced')}</span>
      </div>

      <div class="note-actions">
        <button class="btn-action btn-view" onclick="handleViewNote('${safeNoteKey}')">
          👁️ View Notes
        </button>
        <a class="btn-action btn-download" href="${safeUrl}" download="${safeId}" ${isDrive ? 'target="_blank" rel="noopener noreferrer"' : ''} onclick="handleDownloadClick('${safeNoteKey}')">
          📥 Download
        </a>
      </div>
    </div>
  `}).join('');
}

// Quote-safe Note Action Handlers
function handleViewNote(noteId) {
  const note = currentNotesMap.get(String(noteId));
  if (!note) return;
  const isDrive = Boolean(note.isGoogleDrive || (typeof GDrive !== 'undefined' && GDrive.isGoogleDriveUrl(note.fileUrl)));
  const sanitizeUrl = (typeof Security !== 'undefined') ? Security.sanitizeUrl : (u => u);
  const safeUrl = sanitizeUrl(note.fileUrl);
  const safePreviewUrl = (isDrive && note.previewUrl)
    ? sanitizeUrl(note.previewUrl)
    : (isDrive && typeof GDrive !== 'undefined' ? GDrive.toEmbeddableUrl(safeUrl) : safeUrl);
  const safeDriveUrl = (isDrive && note.driveViewUrl)
    ? sanitizeUrl(note.driveViewUrl)
    : (isDrive && typeof GDrive !== 'undefined' ? GDrive.getViewUrl(GDrive.extractId(safeUrl)) : '');

  openPdfViewer(safeUrl, note.title, safePreviewUrl, safeDriveUrl);
}

function handleDownloadClick(noteId) {
  const note = currentNotesMap.get(String(noteId));
  const title = note ? note.title : 'Study Note';
  trackDownload(title);
}

// PDF Viewer Modal
function openPdfViewer(url, title, customPreviewUrl = null, customDriveUrl = null) {
  const sanitizeUrl = (typeof Security !== 'undefined') ? Security.sanitizeUrl : (u => u);
  const sanitizeFilename = (typeof Security !== 'undefined') ? Security.sanitizeFilename : (f => f);

  const isDrive = Boolean((typeof GDrive !== 'undefined') && (GDrive.isGoogleDriveUrl(url) || (customPreviewUrl && GDrive.isGoogleDriveUrl(customPreviewUrl))));
  const targetEmbedUrl = customPreviewUrl || (isDrive && typeof GDrive !== 'undefined' ? GDrive.toEmbeddableUrl(url) : url);
  const targetDownloadUrl = isDrive && typeof GDrive !== 'undefined' ? GDrive.toDirectDownloadUrl(url) : url;

  const safeFrameUrl = sanitizeUrl(targetEmbedUrl);

  if (!safeFrameUrl || safeFrameUrl === 'about:blank') {
    showToast('⚠️ Cannot open document: Invalid or dangerous file URL');
    return;
  }

  const safeTitle = (typeof Security !== 'undefined') ? Security.escapeHtml(title) : (title || 'Study Note');
  const safeFilename = sanitizeFilename(title || 'Study_Notes');

  if (modalTitle) modalTitle.textContent = safeTitle;
  if (modalFrame) modalFrame.src = safeFrameUrl;
  if (modalDownloadBtn) {
    modalDownloadBtn.href = sanitizeUrl(targetDownloadUrl);
    modalDownloadBtn.setAttribute('download', safeFilename);
    if (isDrive) {
      modalDownloadBtn.setAttribute('target', '_blank');
      modalDownloadBtn.setAttribute('rel', 'noopener noreferrer');
    } else {
      modalDownloadBtn.removeAttribute('target');
      modalDownloadBtn.removeAttribute('rel');
    }
  }

  const modalDriveBtn = document.getElementById('modalDriveBtn');
  if (modalDriveBtn) {
    if (isDrive) {
      const driveDirectLink = customDriveUrl || (typeof GDrive !== 'undefined' ? GDrive.getViewUrl(GDrive.extractId(url)) : url);
      modalDriveBtn.href = sanitizeUrl(driveDirectLink);
      modalDriveBtn.style.display = 'inline-flex';
    } else {
      modalDriveBtn.style.display = 'none';
    }
  }

  if (pdfModal) pdfModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePdfViewer() {
  if (pdfModal) pdfModal.classList.remove('active');
  if (modalFrame) modalFrame.src = 'about:blank';
  document.body.style.overflow = 'auto';
}

// Download feedback
function trackDownload(title) {
  showToast(`📥 Downloading: ${title}`);
}

// Toast notification helper
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// Online / Offline Detection
function setupNetworkListeners() {
  function updateStatus() {
    if (!offlineBanner) return;
    if (navigator.onLine) {
      offlineBanner.classList.remove('active');
    } else {
      offlineBanner.classList.add('active');
    }
  }
  window.addEventListener('online', () => {
    updateStatus();
    showToast('🟢 Back Online');
  });
  window.addEventListener('offline', () => {
    updateStatus();
    showToast('🔴 Offline Mode: Showing downloaded & cached notes');
  });
  updateStatus();
}

// Utility: Escape HTML strings
function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Global Browser Window Bindings
if (typeof window !== 'undefined') {
  window.selectClass = selectClass;
  window.goHome = goHome;
  window.openPdfViewer = openPdfViewer;
  window.closePdfViewer = closePdfViewer;
  window.filterSubject = filterSubject;
  window.trackDownload = trackDownload;
  window.showToast = showToast;
  window.reloadAllData = reloadAllData;
  window.handleViewNote = handleViewNote;
  window.handleDownloadClick = handleDownloadClick;
}
