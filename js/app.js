// Application Controller for SS+2 High School Ghaghra Notes App

let currentMode = 'folder'; // 'folder' (primary Google Drive folder headers) | 'class' (secondary)
let currentFolderCategory = 'DDEO';
let currentSubFolder = 'all';
let currentClass = '9th';
let currentSubject = 'all';
let currentSearch = '';
let appClassesData = (typeof window !== 'undefined' && window.CLASSES_DATA) 
  ? window.CLASSES_DATA 
  : (typeof CLASSES_DATA !== 'undefined' ? CLASSES_DATA : {});
let appFolderData = (typeof window !== 'undefined' && window.FOLDER_CATEGORIES_CONFIG)
  ? window.FOLDER_CATEGORIES_CONFIG
  : (typeof FOLDER_CATEGORIES_CONFIG !== 'undefined' ? FOLDER_CATEGORIES_CONFIG : {});
const currentNotesMap = new Map();

// DOM Elements
const homeScreen = document.getElementById('homeScreen');
const notesScreen = document.getElementById('notesScreen');
const navBar = document.getElementById('navBar');
const mainHeader = document.getElementById('mainHeader');
const offlineBanner = document.getElementById('offlineBanner');
const posterContainer = document.getElementById('posterContainer');
const folderCategoriesContainer = document.getElementById('folderCategoriesContainer');
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
  renderFolderCategories();
  renderPosters();
  setupNetworkListeners();
  setupSearch();
  checkGoogleDriveSync();
});

// Auto-reload data when user switches back to this tab (e.g. from Admin portal)
window.addEventListener('focus', async () => {
  await reloadAllData();
  renderFolderCategories();
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
      renderFolderCategories();
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

    if (typeof getMergedFolderCategoriesData === 'function') {
      appFolderData = await getMergedFolderCategoriesData();
    } else if (typeof window !== 'undefined' && window.FOLDER_CATEGORIES_CONFIG) {
      appFolderData = window.FOLDER_CATEGORIES_CONFIG;
    } else if (typeof FOLDER_CATEGORIES_CONFIG !== 'undefined') {
      appFolderData = FOLDER_CATEGORIES_CONFIG;
    }
  } catch (err) {
    console.error('Error reloading app data:', err);
    if (typeof CLASSES_DATA !== 'undefined') {
      appClassesData = CLASSES_DATA;
    }
    if (typeof FOLDER_CATEGORIES_CONFIG !== 'undefined') {
      appFolderData = FOLDER_CATEGORIES_CONFIG;
    }
  }
}

// Render Page 1 Vocational Folder Header Categories (Google Drive Hierarchy)
function renderFolderCategories() {
  if (!folderCategoriesContainer) return;
  const categories = appFolderData || (typeof window !== 'undefined' && window.FOLDER_CATEGORIES_CONFIG) || FOLDER_CATEGORIES_CONFIG || {};
  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);

  const keys = Object.keys(categories);
  if (keys.length === 0) return;

  folderCategoriesContainer.innerHTML = keys.map(k => {
    const cat = categories[k];
    const noteCount = (cat.notes && Array.isArray(cat.notes)) ? cat.notes.length : 0;
    const subfolders = cat.subfolders || [];
    const badgeColor = cat.badgeColor || '#2563eb';

    const subPillsHtml = subfolders.filter(s => s.id !== 'all').map(sub => `
      <span class="folder-sub-pill" onclick="event.stopPropagation(); selectFolderCategory('${esc(cat.id)}', '${esc(sub.id)}')">
        <span>${esc(sub.icon || '📁')}</span> ${esc(sub.name.replace(/^[^\w\s]+\s*/, ''))}
      </span>
    `).join('');

    return `
      <div class="folder-card" onclick="selectFolderCategory('${esc(cat.id)}', 'all')">
        <div class="folder-card-top">
          <div class="folder-icon-wrap" style="background: ${badgeColor}18; color: ${badgeColor};">
            ${esc(cat.icon || '📁')}
          </div>
          <span class="folder-badge" style="background: ${badgeColor}18; color: ${badgeColor}; border: 1px solid ${badgeColor}35;">
            ${esc(cat.badge || 'FOLDER')}
          </span>
        </div>

        <div>
          <div class="folder-card-title">
            ${esc(cat.name)}
          </div>
          <div class="folder-card-fullname">${esc(cat.fullName || cat.name)}</div>
          <div class="folder-card-desc">${esc(cat.description || '')}</div>
        </div>

        ${subPillsHtml ? `<div class="folder-subfolder-pills">${subPillsHtml}</div>` : ''}

        <div class="folder-card-footer">
          <span>📚 ${noteCount} Study Note${noteCount === 1 ? '' : 's'}</span>
          <span class="folder-open-arrow">Open Folder →</span>
        </div>
      </div>
    `;
  }).join('');
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

// Select Folder Category (Primary: DDEO, JSD, BOOKS, HTML NOTES, ExtraS, ALL CLASSES)
async function selectFolderCategory(folderKey, subFolderId = 'all') {
  await reloadAllData();

  const sourceData = appFolderData || (typeof window !== 'undefined' && window.FOLDER_CATEGORIES_CONFIG) || FOLDER_CATEGORIES_CONFIG || {};
  const folder = sourceData[folderKey];
  if (!folder) {
    console.warn('Folder category not found:', folderKey);
    return;
  }

  currentMode = 'folder';
  currentFolderCategory = folderKey;
  currentSubFolder = subFolderId || 'all';
  currentSearch = '';
  if (searchInput) searchInput.value = '';

  if (classHeading) {
    classHeading.innerHTML = `<span>${folder.icon || '📁'}</span> ${folder.name} <span style="font-size: 0.82em; font-weight: 500; opacity: 0.9;">- ${folder.fullName || ''}</span>`;
  }
  if (classSubheading) {
    classSubheading.textContent = `${folder.hindiName || ''} • ${folder.description || ''}`;
  }

  renderSubFolderFilters(folder);
  renderNotes();

  // Screen Transition: Home -> Notes
  if (homeScreen) homeScreen.classList.remove('active');
  if (notesScreen) notesScreen.classList.add('active');
  if (navBar) navBar.style.display = 'flex';
  if (mainHeader) mainHeader.style.display = 'none';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Subfolder Filter Pills for Folder Category View
function renderSubFolderFilters(folder) {
  if (!subjectFilters || !folder) return;
  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);
  const subfolders = folder.subfolders || [{ id: 'all', name: '📁 All Files', icon: '📁' }];

  subjectFilters.innerHTML = subfolders.map(sub => `
    <button class="subject-pill ${currentSubFolder === sub.id ? 'active' : ''}" onclick="filterSubFolder('${esc(sub.id)}')">
      <span>${esc(sub.icon || '📁')}</span> ${esc(sub.name)}
    </button>
  `).join('');
}

// Filter Notes by Subfolder
function filterSubFolder(subFolderId) {
  currentSubFolder = subFolderId;
  const source = appFolderData || (typeof window !== 'undefined' && window.FOLDER_CATEGORIES_CONFIG) || FOLDER_CATEGORIES_CONFIG;
  const folder = source[currentFolderCategory];
  renderSubFolderFilters(folder);
  renderNotes();
}

// Select Class (Secondary: Diamond Quadrants or Quick Buttons)
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

  currentMode = 'class';
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

// Render Subject Filter Pills (Class View)
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

// Filter Notes by Subject (Class View)
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

// Render Notes for Selected Category/Class & Active Filters
function renderNotes() {
  if (!notesContainer) return;
  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);
  const sanitizeUrl = (typeof Security !== 'undefined') ? Security.sanitizeUrl : (u => u);
  const sanitizeFilename = (typeof Security !== 'undefined') ? Security.sanitizeFilename : (f => f);

  let allNotes = [];

  if (currentMode === 'folder') {
    const sourceFolder = appFolderData || (typeof window !== 'undefined' && window.FOLDER_CATEGORIES_CONFIG) || FOLDER_CATEGORIES_CONFIG;
    const folder = sourceFolder ? sourceFolder[currentFolderCategory] : null;
    if (!folder || !folder.notes) return;

    allNotes = [...folder.notes];

    // Filter by Subfolder
    if (currentSubFolder && currentSubFolder !== 'all') {
      allNotes = allNotes.filter(n => {
        const sId = (n.subFolder || '').toLowerCase();
        const cKey = (n.classKey || '').toLowerCase();
        const title = (n.title || '').toLowerCase();
        const subId = (n.subjectId || '').toLowerCase();

        if (currentSubFolder === 'class9') {
          return sId === 'class9' || cKey === '9th' || cKey === '9' || /class\s*9|9th/i.test(title);
        }
        if (currentSubFolder === 'class10') {
          return sId === 'class10' || cKey === '10th' || cKey === '10' || /class\s*10|10th/i.test(title);
        }
        if (currentSubFolder === 'class11') {
          return sId === 'class11' || cKey === '11th' || cKey === '11' || /class\s*11|11th/i.test(title);
        }
        if (currentSubFolder === 'class12') {
          return sId === 'class12' || cKey === '12th' || cKey === '12' || /class\s*12|12th/i.test(title);
        }
        if (currentSubFolder === 'common') {
          return sId === 'common' || n.isCommon || subId === 'part-a' || /common|employability/i.test(title);
        }
        if (currentSubFolder === 'questions') {
          return sId === 'questions' || subId === 'sample-papers' || /question|sample|model|pyq|blueprint/i.test(title);
        }
        return sId === currentSubFolder.toLowerCase();
      });
    }
  } else {
    const sourceClass = appClassesData || (typeof window !== 'undefined' && window.CLASSES_DATA) || CLASSES_DATA;
    const classData = sourceClass ? sourceClass[currentClass] : null;
    if (!classData || !classData.subjects) return;

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
  }

  // Apply Search Filter (Null-safe)
  if (currentSearch) {
    allNotes = allNotes.filter(n =>
      ((n.title || '').toLowerCase().includes(currentSearch)) ||
      ((n.hindiTitle || '').toLowerCase().includes(currentSearch)) ||
      ((n.subjectName || '').toLowerCase().includes(currentSearch)) ||
      ((n.folderHeader || '').toLowerCase().includes(currentSearch))
    );
  }

  if (allNotes.length === 0) {
    notesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p><strong>No notes found</strong></p>
        <p style="font-size: 0.8rem; margin-top: 4px;">No files match your search or filter criteria.</p>
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

    const headerTag = n.folderHeader || (n.classKey ? (['11th','12th'].includes(n.classKey) ? 'JSD' : 'DDEO') : 'IT/ITeS');
    const classDetail = n.classKey ? ` • Class ${n.classKey}` : (n.subjectName ? ` • ${n.subjectName}` : '');

    return `
    <div class="note-card ${isSyl ? 'syllabus-card' : ''} ${isDrive ? 'gdrive-card' : ''}">
      <div class="note-card-top">
        <div>
          <div style="font-size: 0.72rem; font-weight: 700; color: ${esc(n.subjectColor || '#2563eb')}; margin-bottom: 2px;">
            ${esc(n.subjectIcon || (currentMode === 'folder' ? '📁' : '💻'))} ${esc(headerTag)}${esc(classDetail)}
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

  const modalDriveHelper = document.getElementById('modalDriveHelper');
  const modalDirectOpenBtn = document.getElementById('modalDirectOpenBtn');
  const modalExternalLink = document.getElementById('modalExternalLink');
  const modalDriveBtn = document.getElementById('modalDriveBtn');

  if (isDrive) {
    const driveDirectLink = customDriveUrl || (typeof GDrive !== 'undefined' ? GDrive.getViewUrl(GDrive.extractId(url)) : url);
    const safeDirectLink = sanitizeUrl(driveDirectLink);

    if (modalDriveHelper) modalDriveHelper.style.display = 'flex';
    if (modalDirectOpenBtn) modalDirectOpenBtn.href = safeDirectLink;
    if (modalExternalLink) {
      modalExternalLink.href = safeDirectLink;
      modalExternalLink.style.display = 'inline-flex';
    }
    if (modalDriveBtn) {
      modalDriveBtn.href = safeDirectLink;
      modalDriveBtn.style.display = 'inline-flex';
    }
  } else {
    if (modalDriveHelper) modalDriveHelper.style.display = 'none';
    if (modalExternalLink) {
      modalExternalLink.href = safeFrameUrl;
      modalExternalLink.style.display = 'inline-flex';
    }
    if (modalDriveBtn) {
      modalDriveBtn.style.display = 'none';
    }
  }

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

  if (pdfModal) pdfModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePdfViewer() {
  if (pdfModal) pdfModal.classList.remove('active');
  if (modalFrame) modalFrame.src = 'about:blank';
  const modalDriveHelper = document.getElementById('modalDriveHelper');
  if (modalDriveHelper) modalDriveHelper.style.display = 'none';
  const modalExternalLink = document.getElementById('modalExternalLink');
  if (modalExternalLink) modalExternalLink.style.display = 'none';
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

// Discreet / Hidden Admin Portal Access (Hidden from regular students)
// 1. Five quick taps on the footer title (works on mobile / touchscreen)
// 2. Keyboard shortcut: Ctrl + Shift + A / Cmd + Shift + A
(function setupDiscreetAdminAccess() {
  let tapCount = 0;
  let tapTimer = null;

  document.addEventListener('DOMContentLoaded', () => {
    const footerTitle = document.getElementById('schoolFooterTitle');
    if (footerTitle) {
      footerTitle.addEventListener('click', () => {
        tapCount++;
        clearTimeout(tapTimer);
        if (tapCount >= 5) {
          tapCount = 0;
          showToast('🔐 Opening Teacher / Admin Portal...');
          setTimeout(() => { window.location.href = './admin.html'; }, 600);
        } else {
          tapTimer = setTimeout(() => { tapCount = 0; }, 2500);
        }
      });
    }
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      showToast('🔐 Opening Teacher / Admin Portal...');
      setTimeout(() => { window.location.href = './admin.html'; }, 400);
    }
  });
})();

// Global Browser Window Bindings
if (typeof window !== 'undefined') {
  window.selectFolderCategory = selectFolderCategory;
  window.filterSubFolder = filterSubFolder;
  window.renderFolderCategories = renderFolderCategories;
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
