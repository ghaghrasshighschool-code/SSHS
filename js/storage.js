// Shared Storage & Database Layer for SS+2 High School Ghaghra
// Uses IndexedDB for PDF Blob storage and LocalStorage for metadata
// 100% Self-Hosted Study Library: All PDF files stored with website code under ./notes/

const DB_NAME = 'SSHS_Notes_DB';
const DB_VERSION = 1;
const STORE_PDFS = 'pdf_files';
const STORAGE_KEY_CUSTOM_NOTES = 'sshs_custom_notes';
const STORAGE_KEY_CUSTOM_POSTERS = 'sshs_custom_posters';
const STORAGE_KEY_DELETED_IDS = 'sshs_deleted_note_ids';

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_PDFS)) {
        db.createObjectStore(STORE_PDFS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save PDF Blob to IndexedDB
async function savePdfBlob(noteId, blob, fileName) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PDFS, 'readwrite');
      const store = tx.objectStore(STORE_PDFS);
      store.put({ id: noteId, blob: blob, fileName: fileName, timestamp: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error saving PDF blob:', err);
    return false;
  }
}

// Retrieve PDF Blob from IndexedDB
async function getPdfBlob(noteId) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PDFS, 'readonly');
      const store = tx.objectStore(STORE_PDFS);
      const req = store.get(noteId);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error getting PDF blob:', err);
    return null;
  }
}

// Delete PDF Blob from IndexedDB
async function deletePdfBlob(noteId) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PDFS, 'readwrite');
      const store = tx.objectStore(STORE_PDFS);
      store.delete(noteId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error deleting PDF blob:', err);
    return false;
  }
}

// Get Custom Notes from LocalStorage
function getCustomNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_NOTES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Save Custom Notes to LocalStorage
function saveCustomNotes(notes) {
  localStorage.setItem(STORAGE_KEY_CUSTOM_NOTES, JSON.stringify(notes));
}

// Get Deleted Note IDs (for hiding default notes)
function getDeletedNoteIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveDeletedNoteIds(ids) {
  localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(ids));
}

// Get Custom Posters
function getCustomPosters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_POSTERS);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveCustomPosters(posters) {
  localStorage.setItem(STORAGE_KEY_CUSTOM_POSTERS, JSON.stringify(posters));
}

// Merge default data with custom/uploaded data (All self-hosted)
async function getMergedClassesData() {
  // Deep clone default CLASSES_DATA
  const merged = JSON.parse(JSON.stringify(CLASSES_DATA));
  const deletedIds = new Set(getDeletedNoteIds());
  const customNotes = getCustomNotes();

  // 1. Filter out deleted default notes
  for (const classKey in merged) {
    merged[classKey].subjects.forEach(subject => {
      subject.notes = subject.notes.filter(n => !deletedIds.has(n.id));
    });
  }

  // 2. Append custom uploaded notes
  for (const customNote of customNotes) {
    const targetClass = merged[customNote.classKey];
    if (!targetClass) continue;

    let targetSubject = targetClass.subjects.find(s => s.id === customNote.subjectId);
    if (!targetSubject) {
      // Create new subject if needed
      targetSubject = {
        id: customNote.subjectId,
        name: customNote.subjectName || customNote.subjectId,
        icon: customNote.subjectIcon || '📘',
        color: customNote.subjectColor || '#2563eb',
        notes: []
      };
      targetClass.subjects.push(targetSubject);
    }

    // Check if file is stored as Blob in IndexedDB
    if (customNote.isBlob) {
      const blob = await getPdfBlob(customNote.id);
      if (blob) {
        customNote.fileUrl = URL.createObjectURL(blob);
      }
    }

    // Add to top of notes
    targetSubject.notes.unshift(customNote);
  }

  return merged;
}

// Safe backward-compatible helpers
function deleteDriveNote(noteId) {
  return true;
}

function clearAllDriveNotes() {
  try {
    localStorage.removeItem('sshs_gdrive_synced_notes');
    localStorage.removeItem('sshs_gdrive_config');
  } catch (e) {}
  return true;
}

// Get merged posters
let resolvedCustomPosters = null;

async function resolvePostersBlobs() {
  const custom = getCustomPosters();
  if (!custom || !Array.isArray(custom)) return;
  for (const p of custom) {
    if (p.isBlob && typeof getPdfBlob === 'function') {
      try {
        const blob = await getPdfBlob(`notice-${p.id}`);
        if (blob) {
          p.fileUrl = URL.createObjectURL(blob);
        }
      } catch (err) {
        console.warn('Could not resolve notice blob:', err);
      }
    }
  }
  resolvedCustomPosters = custom;
}

function getMergedPostersData() {
  if (resolvedCustomPosters && Array.isArray(resolvedCustomPosters) && resolvedCustomPosters.length > 0) {
    return resolvedCustomPosters;
  }
  const custom = getCustomPosters();
  if (custom && Array.isArray(custom) && custom.length > 0) {
    return custom;
  }
  return (typeof POSTERS_DATA !== 'undefined') ? POSTERS_DATA : [];
}

// Build Folder-based Categories (DDEO, JSD, BOOKS, HTML NOTES, ExtraS, ALL CLASSES)
// 100% Self-hosted from local files in ./notes/
async function getMergedFolderCategoriesData() {
  const baseConfig = (typeof window !== 'undefined' && window.FOLDER_CATEGORIES_CONFIG)
    ? window.FOLDER_CATEGORIES_CONFIG
    : (typeof FOLDER_CATEGORIES_CONFIG !== 'undefined' ? FOLDER_CATEGORIES_CONFIG : {});

  // Deep clone categories
  const categories = JSON.parse(JSON.stringify(baseConfig));
  for (const k in categories) {
    categories[k].notes = [];
  }

  const deletedIds = new Set(getDeletedNoteIds());
  const classesData = await getMergedClassesData();

  // Helper to add note to category avoiding duplicates
  function addNoteToCategory(catKey, note, subFolderKey = 'all') {
    if (!categories[catKey]) {
      categories[catKey] = {
        id: catKey,
        name: catKey.replace(/_/g, ' '),
        fullName: catKey.replace(/_/g, ' '),
        description: 'Vocational Study Notes',
        icon: '📁',
        badge: 'FOLDER',
        badgeColor: '#2563eb',
        subfolders: [{ id: 'all', name: '📁 All Files', icon: '📁' }],
        notes: []
      };
    }
    const targetCat = categories[catKey];
    if (!targetCat.notes.some(n => n.id === note.id)) {
      targetCat.notes.push({
        ...note,
        folderHeader: catKey,
        subFolder: subFolderKey || note.subFolder || 'all'
      });
    }
  }

  // 1. Process all notes from merged self-hosted dataset
  for (const classKey in classesData) {
    const cls = classesData[classKey];
    cls.subjects.forEach(subject => {
      subject.notes.forEach(note => {
        if (deletedIds.has(note.id)) return;

        // If note has explicit folder header, assign directly to that folder
        const explicitHeader = note.folderHeader ? note.folderHeader.toUpperCase().replace(/\s+/g, '_') : null;
        if (explicitHeader && categories[explicitHeader]) {
          addNoteToCategory(explicitHeader, note, note.subFolder || 'all');
        } else {
          // Default fallback by vocational trade
          if (classKey === '9th' || classKey === '10th') {
            addNoteToCategory('DDEO', note, note.subFolder || (classKey === '9th' ? 'class9' : 'class10'));
          } else {
            addNoteToCategory('JSD', note, note.subFolder || (classKey === '11th' ? 'class11' : 'class12'));
          }
        }
      });
    });
  }

  return categories;
}

// Global Browser Window Bindings
if (typeof window !== 'undefined') {
  window.getMergedClassesData = getMergedClassesData;
  window.getMergedFolderCategoriesData = getMergedFolderCategoriesData;
  window.getMergedPostersData = getMergedPostersData;
  window.resolvePostersBlobs = resolvePostersBlobs;
  window.savePdfBlob = savePdfBlob;
  window.getPdfBlob = getPdfBlob;
  window.deletePdfBlob = deletePdfBlob;
  window.getCustomNotes = getCustomNotes;
  window.saveCustomNotes = saveCustomNotes;
  window.getDeletedNoteIds = getDeletedNoteIds;
  window.saveDeletedNoteIds = saveDeletedNoteIds;
  window.getCustomPosters = getCustomPosters;
  window.saveCustomPosters = saveCustomPosters;
  window.deleteDriveNote = deleteDriveNote;
  window.clearAllDriveNotes = clearAllDriveNotes;
}
