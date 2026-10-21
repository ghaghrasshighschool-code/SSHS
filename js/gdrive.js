// Google Drive Data Source & Synchronization Module for SS+2 High School Ghaghra
// Provides zero-friction connection to Google Drive folders, Google Apps Script feeds,
// Google Sheets catalogs, and direct Google Drive PDF share links.

const GDrive = (function () {
  'use strict';

  const STORAGE_KEY_CONFIG = 'sshs_gdrive_config';
  const STORAGE_KEY_DRIVE_NOTES = 'sshs_gdrive_synced_notes';

  // Default Configuration
  const defaultConfig = {
    scriptUrl: '',          // Google Apps Script Web App URL (doGet)
    folderId: '',           // Public Google Drive Folder ID
    sheetUrl: '',           // Optional Google Sheet CSV or Publish URL
    autoSync: true,         // Silently sync latest notes on app startup when online
    lastSyncTime: null,     // ISO timestamp of last successful sync
    lastSyncCount: 0        // Number of notes synced
  };

  // 1. Get saved Google Drive config
  function getConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (!raw) return { ...defaultConfig };
      return { ...defaultConfig, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('[GDrive] Failed to parse config, using defaults', e);
      return { ...defaultConfig };
    }
  }

  // 2. Save Google Drive config
  function saveConfig(config) {
    const current = getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
    return updated;
  }

  // 3. Robust Google Drive File / Folder ID Extractor
  // Handles all common Google Drive URL variants:
  // - https://drive.google.com/file/d/1A2b3C.../view?usp=sharing
  // - https://drive.google.com/open?id=1A2b3C...
  // - https://drive.google.com/uc?id=1A2b3C...
  // - https://drive.google.com/drive/folders/1A2b3C...
  // - https://docs.google.com/spreadsheets/d/1A2b3C...
  // - Raw ID string
  function extractId(input) {
    if (!input || typeof input !== 'string') return null;
    const str = input.trim();

    // Match /file/d/{ID} or /folders/{ID} or /d/{ID}
    const dMatch = str.match(/\/(?:file\/d|folders|d)\/([a-zA-Z0-9_\-]{20,})/);
    if (dMatch && dMatch[1]) return dMatch[1];

    // Match ?id={ID} or &id={ID}
    const idParamMatch = str.match(/[?&]id=([a-zA-Z0-9_\-]{20,})/);
    if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

    // Raw alphanumeric ID (typically 25 to 45 chars)
    if (/^[a-zA-Z0-9_\-]{25,60}$/.test(str)) {
      return str;
    }

    return null;
  }

  // 4. Transform Google Drive ID into safe embeddable & downloadable URLs
  function getPreviewUrl(fileId) {
    if (!fileId) return 'about:blank';
    return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
  }

  function getDownloadUrl(fileId) {
    if (!fileId) return '#';
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
  }

  function getViewUrl(fileId) {
    if (!fileId) return '#';
    return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view?usp=sharing`;
  }

  // Check if a URL is a Google Drive link
  function isGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  }

  // Convert any arbitrary Google Drive URL into an iframe-embeddable preview URL
  function toEmbeddableUrl(url) {
    if (!url) return 'about:blank';
    if (!isGoogleDriveUrl(url)) return url;
    const fileId = extractId(url);
    if (fileId) {
      return getPreviewUrl(fileId);
    }
    return url;
  }

  // Convert any arbitrary Google Drive URL into a direct download URL
  function toDirectDownloadUrl(url) {
    if (!url) return '#';
    if (!isGoogleDriveUrl(url)) return url;
    const fileId = extractId(url);
    if (fileId) {
      return getDownloadUrl(fileId);
    }
    return url;
  }

  // 5. Get Saved Synced Notes
  function getDriveNotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DRIVE_NOTES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveDriveNotes(notes) {
    localStorage.setItem(STORAGE_KEY_DRIVE_NOTES, JSON.stringify(notes));
  }

  // 6. Sync from Google Apps Script Web App
  // Endpoint returns JSON: { status: 'success', folderName: '...', files: [...] }
  async function syncFromAppsScript(customUrl = null) {
    const config = getConfig();
    const url = (customUrl || config.scriptUrl || '').trim();

    if (!url) {
      throw new Error('Google Apps Script URL is not configured. Please paste your Web App URL in settings.');
    }

    // Append folderId if provided in config and not already in URL
    let fetchUrl = url;
    if (config.folderId && !url.includes('folderId=')) {
      const separator = url.includes('?') ? '&' : '?';
      fetchUrl = `${url}${separator}folderId=${encodeURIComponent(config.folderId)}`;
    }

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(data.message || 'Google Apps Script returned an error.');
    }

    const rawFiles = Array.isArray(data.files) ? data.files : [];
    const processedNotes = [];

    rawFiles.forEach((file, index) => {
      const fileId = file.id || extractId(file.downloadUrl || file.viewUrl);
      if (!fileId) return;

      const fileName = file.name || `IT_Note_${index + 1}.pdf`;

      // Build full path context (e.g. "SSHSGHAGHRA NOTES / IT/ITES / DDEO / Class 9")
      const folderContext = (file.folderPath ? (file.folderPath + ' / ') : '') + (file.folder || '');

      // Use Security.autoCategorize with filename AND folder hierarchy context
      const cat = (typeof Security !== 'undefined' && Security.autoCategorize)
        ? Security.autoCategorize(fileName, folderContext)
        : {
            classKey: '10th',
            categoryId: 'part-b',
            categoryName: '💻 Part B: IT Specific Skills',
            cleanTitle: fileName.replace(/\.[^/.]+$/, ''),
            isSyllabus: false,
            isCommon: false
          };

      const noteTitle = cat.cleanTitle || cat.title || fileName;
      const subjectId = cat.categoryId || cat.subjectId || 'part-b';
      const subjectName = cat.categoryName || cat.subjectName || '💻 Part B: IT Specific Skills';
      const isSyllabus = Boolean(cat.isSyllabus || subjectId === 'syllabus');

      // Determine target classes (if marked Common or All Classes, distribute to matching grades)
      const targetClasses = [];
      const ctxLower = folderContext.toLowerCase();
      if (cat.isCommon || ctxLower.includes('common') || ctxLower.includes('all classes')) {
        if (ctxLower.includes('ddeo')) {
          // DDEO Common applies to Class 9 & 10
          targetClasses.push('9th', '10th');
        } else if (ctxLower.includes('jsd')) {
          // JSD Common applies to Class 11 & 12
          targetClasses.push('11th', '12th');
        } else if (ctxLower.includes('all classes')) {
          targetClasses.push('9th', '10th', '11th', '12th');
        } else {
          targetClasses.push(cat.classKey || '10th');
        }
      } else {
        targetClasses.push(cat.classKey || '10th');
      }

      // Add note instance for each relevant class
      targetClasses.forEach(clsKey => {
        processedNotes.push({
          id: `gdrive_${fileId}_${clsKey}`,
          title: noteTitle,
          hindiTitle: `${noteTitle} (गूगल ड्राइव)`,
          fileUrl: getDownloadUrl(fileId),
          previewUrl: getPreviewUrl(fileId),
          driveViewUrl: getViewUrl(fileId),
          fileSize: file.size || 'Google Drive',
          pages: file.pages || 'PDF',
          type: 'PDF',
          uploadedAt: file.updated || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          isNew: true,
          isGoogleDrive: true,
          driveFileId: fileId,
          folderPath: file.folderPath || file.folder || '',
          isSyllabus: isSyllabus,
          classKey: clsKey,
          subjectId: subjectId,
          subjectName: subjectName,
          subjectIcon: isSyllabus ? '📋' : '💻',
          subjectColor: isSyllabus ? '#0284c7' : '#2563eb'
        });
      });
    });

    // Save synced notes
    saveDriveNotes(processedNotes);

    // Update config sync metadata
    const updatedConfig = saveConfig({
      lastSyncTime: new Date().toISOString(),
      lastSyncCount: processedNotes.length
    });

    return {
      count: processedNotes.length,
      folderName: data.folderName || 'Google Drive Folder',
      syncedAt: updatedConfig.lastSyncTime,
      notes: processedNotes
    };
  }

  // 7. Sync from Google Sheets (CSV Export Format)
  // Teacher maintains a Google Sheet with columns:
  // Class | Section | Title | Drive Link | Size | Pages
  async function syncFromGoogleSheet(sheetInput) {
    const sheetId = extractId(sheetInput) || sheetInput.trim();
    if (!sheetId) {
      throw new Error('Invalid Google Sheet Link or ID.');
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv`;

    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Could not fetch Google Sheet CSV (HTTP ${response.status}). Ensure the sheet is shared as "Anyone with link can view".`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      throw new Error('Google Sheet appears to be empty or has no data rows.');
    }

    // Auto-detect column headers
    const headerRow = rows[0].map(h => h.toLowerCase().trim());
    const colClass = headerRow.findIndex(h => h.includes('class'));
    const colSection = headerRow.findIndex(h => h.includes('section') || h.includes('subject') || h.includes('part') || h.includes('category'));
    const colTitle = headerRow.findIndex(h => h.includes('title') || h.includes('name') || h.includes('topic'));
    const colLink = headerRow.findIndex(h => h.includes('link') || h.includes('drive') || h.includes('url') || h.includes('file'));
    const colHindi = headerRow.findIndex(h => h.includes('hindi'));
    const colPages = headerRow.findIndex(h => h.includes('page'));

    const processedNotes = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawLink = colLink !== -1 ? (row[colLink] || '') : (row.find(c => isGoogleDriveUrl(c)) || '');
      const fileId = extractId(rawLink);
      if (!fileId) continue;

      const title = colTitle !== -1 && row[colTitle] ? row[colTitle].trim() : `IT Note ${i}`;
      const rawClass = colClass !== -1 ? row[colClass] : '';
      const rawSection = colSection !== -1 ? row[colSection] : '';
      const hindiTitle = colHindi !== -1 ? row[colHindi] : '';
      const pages = colPages !== -1 ? row[colPages] : 'PDF';

      // Auto-categorize based on title and hints
      const cat = (typeof Security !== 'undefined' && Security.autoCategorize)
        ? Security.autoCategorize(`${rawClass} ${rawSection} ${title}.pdf`)
        : { classKey: '10th', categoryId: 'part-b', categoryName: '💻 Part B: IT Specific Skills', cleanTitle: title, isSyllabus: false };

      const noteSubjectId = cat.categoryId || cat.subjectId || 'part-b';
      const noteSubjectName = cat.categoryName || cat.subjectName || '💻 Part B: IT Specific Skills';
      const noteIsSyllabus = Boolean(cat.isSyllabus || noteSubjectId === 'syllabus');

      processedNotes.push({
        id: `gdrive_${fileId}`,
        title: title || cat.cleanTitle || `IT Note ${i}`,
        hindiTitle: hindiTitle || `${title} (गूगल ड्राइव)`,
        fileUrl: getDownloadUrl(fileId),
        previewUrl: getPreviewUrl(fileId),
        driveViewUrl: getViewUrl(fileId),
        fileSize: 'Google Drive',
        pages: pages || 'PDF',
        type: 'PDF',
        uploadedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        isNew: true,
        isGoogleDrive: true,
        driveFileId: fileId,
        isSyllabus: noteIsSyllabus,
        classKey: cat.classKey || '10th',
        subjectId: noteSubjectId,
        subjectName: noteSubjectName,
        subjectIcon: noteIsSyllabus ? '📋' : '💻',
        subjectColor: noteIsSyllabus ? '#0284c7' : '#2563eb'
      });
    }

    saveDriveNotes(processedNotes);
    const updatedConfig = saveConfig({
      sheetUrl: sheetInput,
      lastSyncTime: new Date().toISOString(),
      lastSyncCount: processedNotes.length
    });

    return {
      count: processedNotes.length,
      folderName: 'Google Sheets Catalog',
      syncedAt: updatedConfig.lastSyncTime,
      notes: processedNotes
    };
  }

  // 8. Import Direct Google Drive Link(s)
  // Supports pasting single or multiple links with optional title
  function importLinks(textInput, defaultClass = null, defaultSection = null) {
    if (!textInput || typeof textInput !== 'string') return [];

    const lines = textInput.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const addedNotes = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let urlPart = line;
      let titlePart = '';

      if (line.includes(' - http')) {
        const parts = line.split(' - http');
        titlePart = parts[0].trim();
        urlPart = 'http' + parts[1].trim();
      } else if (line.includes('|')) {
        const parts = line.split('|');
        titlePart = parts[0].trim();
        urlPart = parts[1].trim();
      }

      const fileId = extractId(urlPart);
      if (!fileId) continue;

      const assumedName = titlePart || `Google_Drive_Note_${fileId.substring(0, 6)}.pdf`;
      const cat = (typeof Security !== 'undefined' && Security.autoCategorize)
        ? Security.autoCategorize(assumedName)
        : { classKey: '10th', categoryId: 'part-b', categoryName: '💻 Part B: IT Specific Skills', cleanTitle: assumedName, isSyllabus: false };

      const targetClass = defaultClass || cat.classKey || '10th';
      const targetSection = defaultSection || cat.categoryId || cat.subjectId || 'part-b';
      const targetTitle = titlePart || cat.cleanTitle || cat.title || `Google Drive Note ${i + 1}`;
      const isSyllabus = Boolean(targetSection === 'syllabus' || cat.isSyllabus);

      const note = {
        id: `gdrive_${fileId}`,
        title: targetTitle,
        hindiTitle: `${targetTitle} (गूगल ड्राइव)`,
        fileUrl: getDownloadUrl(fileId),
        previewUrl: getPreviewUrl(fileId),
        driveViewUrl: getViewUrl(fileId),
        fileSize: 'Google Drive',
        pages: 'PDF',
        type: 'PDF',
        uploadedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        isNew: true,
        isGoogleDrive: true,
        driveFileId: fileId,
        isSyllabus: isSyllabus,
        classKey: targetClass,
        subjectId: targetSection,
        subjectName: cat.categoryName || cat.subjectName || (isSyllabus ? '📋 Syllabus (पाठ्यक्रम)' : '💻 Part B: IT Specific Skills'),
        subjectIcon: isSyllabus ? '📋' : '💻',
        subjectColor: isSyllabus ? '#0284c7' : '#2563eb'
      };

      addedNotes.push(note);
    }

    if (addedNotes.length > 0) {
      const existing = getDriveNotes();
      // Remove duplicates by id
      const existingMap = new Map(existing.map(n => [n.id, n]));
      addedNotes.forEach(n => existingMap.set(n.id, n));
      const combined = Array.from(existingMap.values());
      saveDriveNotes(combined);
      saveConfig({
        lastSyncTime: new Date().toISOString(),
        lastSyncCount: combined.length
      });
    }

    return addedNotes;
  }

  // Helper: Simple CSV parser handling quotes
  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    return lines.map(line => {
      const cells = [];
      let inQuotes = false;
      let current = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      return cells;
    });
  }

  // Public API
  return {
    getConfig,
    saveConfig,
    extractId,
    getPreviewUrl,
    getDownloadUrl,
    getViewUrl,
    isGoogleDriveUrl,
    toEmbeddableUrl,
    toDirectDownloadUrl,
    getDriveNotes,
    saveDriveNotes,
    syncFromAppsScript,
    syncFromGoogleSheet,
    importLinks
  };
})();

// Global browser window binding
if (typeof window !== 'undefined') {
  window.GDrive = GDrive;
}
