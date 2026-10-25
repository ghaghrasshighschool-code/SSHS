// Application Controller for SS+2 High School Ghaghra Notes App

let currentMode = 'folder'; // 'folder' (primary self-hosted folder categories) | 'class' (secondary)
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
  renderMarqueeTicker();
  setupNetworkListeners();
  setupSearch();
});

// Auto-reload data when user switches back to this tab (e.g. from Admin portal)
window.addEventListener('focus', async () => {
  await reloadAllData();
  renderFolderCategories();
  renderPosters();
  renderMarqueeTicker();
  if (notesScreen && notesScreen.classList.contains('active')) {
    renderNotes();
  }
});

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

    if (typeof resolvePostersBlobs === 'function') {
      await resolvePostersBlobs();
    }
  } catch (err) {
    console.error('Error reloading app data:', err);
    if (typeof CLASSES_DATA !== 'undefined') {
      appClassesData = CLASSES_DATA;
    }
    if (typeof FOLDER_CATEGORIES_CONFIG !== 'undefined') {
      appFolderData = FOLDER_CATEGORIES_CONFIG;
    }
  } finally {
    if (typeof renderMarqueeTicker === 'function') {
      renderMarqueeTicker();
    }
  }
}

// Render Page 1 Vocational Folder Header Categories (Self-Hosted Library Hierarchy)
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
      <div class="folder-card" style="--card-accent: ${badgeColor};" onclick="selectFolderCategory('${esc(cat.id)}', 'all')">
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

  if (!posters || posters.length === 0) {
    posterContainer.innerHTML = `
      <div class="empty-state" style="padding: 24px 16px; margin: 0 auto; grid-column: 1 / -1; text-align: center;">
        <div style="font-size: 2rem; margin-bottom: 6px;">📢</div>
        <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">No Active Notices Posted</div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; max-width: 440px; margin-left: auto; margin-right: auto;">Official school circulars, exam schedules, and notices will appear here when published by the administration.</p>
      </div>
    `;
    return;
  }

  posterContainer.innerHTML = posters.map(p => {
    const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);
    const sanitizeUrl = (typeof Security !== 'undefined') ? Security.sanitizeUrl : (u => u);
    const hasFile = p.fileUrl && p.fileUrl.trim() !== '';
    const safeUrl = hasFile ? sanitizeUrl(p.fileUrl) : '';

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
          ${hasFile ? `
            <div class="poster-actions">
              <button class="btn-poster-action" onclick="openPdfViewer('${safeUrl}', '${esc(p.title)}')" title="View Notice Document">
                📄 View Circular
              </button>
              <a class="btn-poster-action" href="${safeUrl}" download onclick="trackDownload('${esc(p.title)}')">
                📥 Download
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Render Running Marquee Live Ticker (Notices & New Notes)
function renderMarqueeTicker() {
  const track = document.getElementById('marqueeTrack');
  if (!track) return;

  const esc = (typeof Security !== 'undefined') ? Security.escapeHtml : (s => s);
  const sanitizeUrl = (typeof Security !== 'undefined') ? Security.sanitizeUrl : (u => u);

  const items = [];

  // 1. Live Active Notices / Circulars (from storage or data.js)
  const posters = (typeof getMergedPostersData === 'function') 
    ? getMergedPostersData() 
    : ((typeof window !== 'undefined' && window.POSTERS_DATA) ? window.POSTERS_DATA : (typeof POSTERS_DATA !== 'undefined' ? POSTERS_DATA : []));

  if (Array.isArray(posters) && posters.length > 0) {
    posters.forEach(p => {
      const hasFile = p.fileUrl && p.fileUrl.trim() !== '';
      const safeUrl = hasFile ? sanitizeUrl(p.fileUrl) : '';
      const clickAttr = hasFile 
        ? `onclick="openPdfViewer('${safeUrl}', '${esc(p.title)}')" style="cursor: pointer;" title="Click to view notice circular"`
        : '';
      items.push({
        type: 'notice',
        badge: esc(p.tag || 'NOTICE'),
        icon: esc(p.icon || '📢'),
        text: `<strong>${esc(p.title)}:</strong> ${esc(p.subtitle || 'Official School Notice')}`,
        actionAttr: clickAttr
      });
    });
  }

  // 2. Custom Uploaded Notes (most recently added via Admin)
  const customNotes = (typeof getCustomNotes === 'function') ? getCustomNotes() : [];
  if (Array.isArray(customNotes) && customNotes.length > 0) {
    customNotes.slice(-3).reverse().forEach(n => {
      const safeId = esc(String(n.id));
      items.push({
        type: 'new-note',
        badge: 'NEW NOTE',
        icon: '✨',
        text: `<strong>${esc(n.title)}</strong> (${esc(n.classKey ? 'Class ' + n.classKey : 'IT')} • Recently Uploaded)`,
        actionAttr: `onclick="handleViewNote('${safeId}')" style="cursor: pointer;" title="Click to view note"`
      });
    });
  }

  // 3. Dynamic Curriculum & Study Highlights
  items.push({
    type: 'curriculum',
    badge: '142 NOTES READY',
    icon: '⚡',
    text: `<strong>100% Self-Hosted Library:</strong> All 142 notes, textbooks and syllabus units active!`,
    actionAttr: `onclick="window.scrollTo({top: 420, behavior: 'smooth'})" style="cursor: pointer;" title="Explore notes library"`
  });

  items.push({
    type: 'ddeo',
    badge: 'DDEO • 9th & 10th',
    icon: '💻',
    text: `<strong>LibreOffice Writer & Calc:</strong> Full chapter notes, formulas and practical shortcut keys!`,
    actionAttr: `onclick="selectFolderCategory('DDEO', 'all')" style="cursor: pointer;" title="Open DDEO Notes"`
  });

  items.push({
    type: 'jsd',
    badge: 'JSD • 11th & 12th',
    icon: '🐍',
    text: `<strong>Python & MySQL:</strong> OOPs, Computer Networks, Boolean Logic & Database notes ready!`,
    actionAttr: `onclick="selectFolderCategory('JSD', 'all')" style="cursor: pointer;" title="Open JSD Notes"`
  });

  items.push({
    type: 'html',
    badge: 'HTML & WEB',
    icon: '🌐',
    text: `<strong>Web Design Series:</strong> 10 comprehensive handwritten HTML tutorial chapters ready!`,
    actionAttr: `onclick="selectFolderCategory('HTML_NOTES', 'all')" style="cursor: pointer;" title="Open HTML Notes"`
  });

  items.push({
    type: 'questions',
    badge: 'QUESTION BANKS',
    icon: '📋',
    text: `<strong>JAC Board Papers:</strong> Solved model question papers & previous year question banks!`,
    actionAttr: `onclick="selectFolderCategory('QUESTION_PAPERS', 'all')" style="cursor: pointer;" title="Open Question Papers"`
  });

  items.push({
    type: 'offline',
    badge: '100% OFFLINE',
    icon: '📲',
    text: `<strong>Study Without Internet:</strong> Tap 'Install App' or 'How To' to study offline on Android!`,
    actionAttr: `onclick="openInstallGuide()" style="cursor: pointer;" title="View Android Install Guide"`
  });

  const renderItemSet = () => items.map(item => `
    <div class="marquee-item marquee-item-${item.type}" ${item.actionAttr || ''}>
      <span class="marquee-pill marquee-pill-${item.type}">
        <span class="marquee-item-icon">${item.icon}</span>
        <span class="marquee-item-badge">${item.badge}</span>
      </span>
      <span class="marquee-item-text">${item.text}</span>
    </div>
    <span class="marquee-sep" aria-hidden="true">✦</span>
  `).join('');

  track.innerHTML = `
    <div class="marquee-track-inner marquee-track-primary">
      ${renderItemSet()}
    </div>
    <div class="marquee-track-inner marquee-track-duplicate" aria-hidden="true">
      ${renderItemSet()}
    </div>
  `;
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
  // Always fetch latest merged data so newly uploaded notes appear immediately
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
  if (classHeading) classHeading.textContent = `${classData.name} IT/ITeS Notes & Syllabus`;
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
    const safeUrl = sanitizeUrl(n.fileUrl);
    const safeId = sanitizeFilename(n.id || `note-${idx}`);
    const isSyl = n.isSyllabus || (n.subjectId === 'syllabus') || (n.id && n.id.includes('syl'));
    const safeNoteKey = esc(String(n.id || idx));
    const displayTitle = n.title || n.name || n.cleanTitle || 'Study Note';

    const headerTag = n.folderHeader || (n.classKey ? (['11th','12th'].includes(n.classKey) ? 'JSD' : 'DDEO') : 'IT/ITeS');
    const classDetail = n.classKey ? ` • Class ${n.classKey}` : (n.subjectName ? ` • ${n.subjectName}` : '');

    return `
    <div class="note-card ${isSyl ? 'syllabus-card' : ''}" style="--note-accent: ${esc(n.subjectColor || '#2563eb')};">
      <div class="note-card-top" onclick="handleViewNote('${safeNoteKey}')" title="Click to view ${esc(displayTitle)}">
        <div>
          <div style="font-size: 0.72rem; font-weight: 700; color: ${esc(n.subjectColor || '#2563eb')}; margin-bottom: 2px;">
            ${esc(n.subjectIcon || (currentMode === 'folder' ? '📁' : '💻'))} ${esc(headerTag)}${esc(classDetail)}
          </div>
          <div class="note-title">${esc(displayTitle)}</div>
          <div class="note-hindi-title">${esc(n.hindiTitle || '')}</div>
        </div>
        <div class="badge-stack">
          ${isSyl ? '<span class="note-badge-syllabus">📋 OFFICIAL SYLLABUS</span>' : (n.isNew ? '<span class="note-badge">NEW</span>' : '')}
        </div>
      </div>

      <div class="note-meta">
        <span class="note-meta-item">📄 ${esc(n.pages || 'PDF')} Pages</span>
        <span class="note-meta-item">💾 ${esc(n.fileSize || 'Self-Hosted')}</span>
        <span class="note-meta-item">📅 ${esc(n.uploadedAt || 'Ready')}</span>
      </div>

      <div class="note-actions">
        <button class="btn-action btn-view" onclick="handleViewNote('${safeNoteKey}')">
          👁️ View Notes
        </button>
        <a class="btn-action btn-download" href="${safeUrl}" download="${safeId}" onclick="handleDownloadClick('${safeNoteKey}')">
          📥 Download
        </a>
      </div>
    </div>
  `}).join('');
}

// Quote-safe Note Action Handlers
function handleViewNote(noteId) {
  let note = currentNotesMap.get(String(noteId));
  if (!note && typeof appClassesData !== 'undefined') {
    for (const ck in appClassesData) {
      for (const s of (appClassesData[ck].subjects || [])) {
        const found = (s.notes || []).find(n => String(n.id) === String(noteId));
        if (found) { note = found; break; }
      }
      if (note) break;
    }
  }
  if (!note && typeof appFolderData !== 'undefined') {
    for (const fk in appFolderData) {
      const found = (appFolderData[fk].notes || []).find(n => String(n.id) === String(noteId));
      if (found) { note = found; break; }
    }
  }
  if (!note && typeof window !== 'undefined' && window.CLASSES_DATA) {
    for (const ck in window.CLASSES_DATA) {
      for (const s of (window.CLASSES_DATA[ck].subjects || [])) {
        const found = (s.notes || []).find(n => String(n.id) === String(noteId));
        if (found) { note = found; break; }
      }
      if (note) break;
    }
  }
  if (!note) {
    showToast('⚠️ Note details not found.');
    return;
  }

  const sanitizeUrl = (typeof Security !== 'undefined') ? Security.sanitizeUrl : (u => u);
  const safeUrl = sanitizeUrl(note.fileUrl);
  const noteTitle = note.title || note.name || note.cleanTitle || 'Study Note';

  openPdfViewer(safeUrl, noteTitle);
}

function handleDownloadClick(noteId) {
  let note = currentNotesMap.get(String(noteId));
  if (!note && typeof appClassesData !== 'undefined') {
    for (const ck in appClassesData) {
      for (const s of (appClassesData[ck].subjects || [])) {
        const found = (s.notes || []).find(n => String(n.id) === String(noteId));
        if (found) { note = found; break; }
      }
      if (note) break;
    }
  }
  const title = note ? (note.title || note.name || note.cleanTitle || 'Study Note') : 'Study Note';
  trackDownload(title);
}

// PDF Viewer Modal (Self-Hosted Direct Viewer)
function openPdfViewer(url, title) {
  const sanitizeUrl = (typeof Security !== 'undefined') ? Security.sanitizeUrl : (u => u);
  const sanitizeFilename = (typeof Security !== 'undefined') ? Security.sanitizeFilename : (f => f);

  const safeFrameUrl = sanitizeUrl(url);

  if (!safeFrameUrl || safeFrameUrl === 'about:blank') {
    showToast('⚠️ Cannot open document: Invalid or dangerous file URL');
    return;
  }

  const rawTitle = title || 'Study Note';
  const safeFilename = sanitizeFilename(rawTitle) + '.pdf';

  // Store active viewing note details for issue reporting
  const activeClassStr = (typeof currentClass !== 'undefined' && currentClass) ? currentClass : '9th';
  window.currentViewingNote = {
    url: safeFrameUrl,
    title: rawTitle,
    rawTitle: rawTitle,
    activeClass: activeClassStr
  };

  const elModal = document.getElementById('pdfModal');
  const elTitle = document.getElementById('modalTitle');
  const elFrame = document.getElementById('modalFrame');
  const elDownload = document.getElementById('modalDownloadBtn');
  const elExternalLink = document.getElementById('modalExternalLink');
  const elDirectLink = document.getElementById('modalDirectLink');

  // Set plain text so slashes, ampersands and special characters display naturally
  if (elTitle) elTitle.textContent = rawTitle;

  if (elFrame) {
    elFrame.removeAttribute('loading'); // Ensure no lazy-loading blocker
    elFrame.src = safeFrameUrl;
  }

  if (elDirectLink) {
    elDirectLink.href = safeFrameUrl;
  }

  if (elExternalLink) {
    elExternalLink.href = safeFrameUrl;
    elExternalLink.style.display = 'inline-flex';
  }

  if (elDownload) {
    elDownload.href = safeFrameUrl;
    elDownload.setAttribute('download', safeFilename);
    elDownload.removeAttribute('target');
    elDownload.removeAttribute('rel');
  }

  if (elModal) elModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePdfViewer() {
  const elModal = document.getElementById('pdfModal');
  const elFrame = document.getElementById('modalFrame');
  const elExternalLink = document.getElementById('modalExternalLink');

  if (elModal) elModal.classList.remove('active');
  if (elFrame) elFrame.src = 'about:blank';
  if (elExternalLink) elExternalLink.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Student Issue Reporting Handlers
function openReportModal() {
  const modal = document.getElementById('reportModal');
  if (!modal) return;

  const current = window.currentViewingNote || {};
  const elTitle = document.getElementById('reportNoteTitle');
  const elUrl = document.getElementById('reportNoteUrl');
  const elClass = document.getElementById('reportStudentClass');
  const elType = document.getElementById('reportIssueType');
  const elDetails = document.getElementById('reportDetails');
  const elName = document.getElementById('reportStudentName');

  if (elTitle) elTitle.value = current.rawTitle || current.title || 'Study Note';
  if (elUrl) elUrl.value = current.url || '';
  if (elClass && current.activeClass) elClass.value = current.activeClass;
  if (elType) elType.value = '';
  if (elDetails) elDetails.value = '';
  if (elName) elName.value = '';

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeReportModal() {
  const modal = document.getElementById('reportModal');
  if (modal) modal.classList.remove('active');
  const pdfModal = document.getElementById('pdfModal');
  if (!pdfModal || !pdfModal.classList.contains('active')) {
    document.body.style.overflow = 'auto';
  }
}

function handleReportSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const title = (document.getElementById('reportNoteTitle')?.value || '').trim();
  const url = (document.getElementById('reportNoteUrl')?.value || '').trim();
  const issueType = (document.getElementById('reportIssueType')?.value || '').trim();
  const details = (document.getElementById('reportDetails')?.value || '').trim();
  const studentName = (document.getElementById('reportStudentName')?.value || '').trim();
  const studentClass = (document.getElementById('reportStudentClass')?.value || '').trim();

  if (!issueType) {
    showToast('⚠️ Please select the type of problem.');
    return;
  }
  if (!details) {
    showToast('⚠️ Please describe what problem you encountered.');
    return;
  }

  if (typeof saveReportedIssue === 'function') {
    saveReportedIssue({
      noteTitle: title,
      fileUrl: url,
      issueType: issueType,
      studentName: studentName || 'Student',
      studentClass: studentClass,
      details: details
    });
  }

  closeReportModal();
  showToast('✅ Report submitted! Thank you, school IT will inspect and resolve this.');
}

function sendReportViaEmail() {
  const title = (document.getElementById('reportNoteTitle')?.value || '').trim();
  const url = (document.getElementById('reportNoteUrl')?.value || '').trim();
  const issueType = (document.getElementById('reportIssueType')?.value || '').trim();
  const details = (document.getElementById('reportDetails')?.value || '').trim();
  const studentName = (document.getElementById('reportStudentName')?.value || '').trim();
  const studentClass = (document.getElementById('reportStudentClass')?.value || '').trim();

  const subject = encodeURIComponent(`[SSHS Portal Issue Report] ${title || 'Study Note'}`);
  const body = encodeURIComponent(
    `SS+2 High School Ghaghra - Portal Issue Report\n` +
    `--------------------------------------------------\n` +
    `Document: ${title}\n` +
    `File URL: ${url}\n` +
    `Issue Category: ${issueType}\n` +
    `Student / Sender: ${studentName || 'Anonymous'} (Class: ${studentClass || 'Not specified'})\n\n` +
    `Description of Problem:\n${details || 'No description provided'}\n\n` +
    `Sent from SSHS Study Portal notes viewer.`
  );

  window.open(`mailto:support@sshsghaghra.edu.in?subject=${subject}&body=${body}`, '_blank');
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
  window.openReportModal = openReportModal;
  window.closeReportModal = closeReportModal;
  window.handleReportSubmit = handleReportSubmit;
  window.sendReportViaEmail = sendReportViaEmail;
  window.renderMarqueeTicker = renderMarqueeTicker;
}
