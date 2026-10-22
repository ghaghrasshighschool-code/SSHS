// Shared Storage & Database Layer for SS+2 High School Ghaghra
// Uses IndexedDB for PDF Blob storage and LocalStorage for metadata

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

// Merge default data with custom/uploaded data
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

  // 3. Append Google Drive synced notes
  try {
    let driveNotes = [];
    if (typeof GDrive !== 'undefined' && typeof GDrive.getDriveNotes === 'function') {
      driveNotes = GDrive.getDriveNotes();
    } else {
      try {
        const raw = localStorage.getItem('sshs_gdrive_synced_notes');
        driveNotes = raw ? JSON.parse(raw) : [];
      } catch (e) {
        driveNotes = [];
      }
    }

    // Normalizes all variations of class keys ('9', '9th', 'Class 9', 'ix', 'all', 'common', 'ddeo', 'jsd')
    function resolveClassKeys(rawKey) {
      if (!rawKey) return ['9th'];
      const s = String(rawKey).toLowerCase().trim();
      if (s === 'all' || s === 'all classes' || s === 'common') {
        return ['9th', '10th', '11th', '12th'];
      }
      if (s === 'ddeo') {
        return ['9th', '10th'];
      }
      if (s === 'jsd') {
        return ['11th', '12th'];
      }
      if (/(?:class|cl)?[ _-]*12(?:th)?\b|xii\b/.test(s)) return ['12th'];
      if (/(?:class|cl)?[ _-]*11(?:th)?\b|xi\b/.test(s)) return ['11th'];
      if (/(?:class|cl)?[ _-]*10(?:th)?\b|x\b/.test(s)) return ['10th'];
      if (/(?:class|cl)?[ _-]*9(?:th)?\b|ix\b/.test(s)) return ['9th'];
      return ['9th'];
    }

    for (const driveNote of driveNotes) {
      if (deletedIds.has(driveNote.id) || (driveNote.driveFileId && deletedIds.has(driveNote.driveFileId))) {
        continue;
      }

      const targetClassKeys = resolveClassKeys(driveNote.classKey);
      const subId = driveNote.subjectId || (driveNote.isSyllabus ? 'syllabus' : 'part-b');

      targetClassKeys.forEach(classKey => {
        const targetClass = merged[classKey];
        if (!targetClass) return;

        let targetSubject = targetClass.subjects.find(s => s.id === subId);
        if (!targetSubject) {
          targetSubject = {
            id: subId,
            name: driveNote.subjectName || (driveNote.isSyllabus ? '📋 Syllabus (पाठ्यक्रम)' : '💻 Part B: IT Specific Skills'),
            icon: driveNote.subjectIcon || (driveNote.isSyllabus ? '📋' : '💻'),
            color: driveNote.subjectColor || (driveNote.isSyllabus ? '#0284c7' : '#2563eb'),
            notes: []
          };
          targetClass.subjects.push(targetSubject);
        }

        // Avoid duplicates by comparing ID and driveFileId
        const alreadyExists = targetSubject.notes.some(n =>
          n.id === driveNote.id ||
          (driveNote.driveFileId && (n.driveFileId === driveNote.driveFileId || n.id.includes(driveNote.driveFileId)))
        );

        if (!alreadyExists) {
          targetSubject.notes.unshift({
            ...driveNote,
            classKey: classKey,
            subjectId: subId
          });
        }
      });
    }
  } catch (gErr) {
    console.warn('[Storage] Error merging Google Drive notes:', gErr);
  }

  return merged;
}

// Delete a Google Drive note from local sync cache
function deleteDriveNote(noteId) {
  if (typeof GDrive === 'undefined') return false;
  const notes = GDrive.getDriveNotes();
  const filtered = notes.filter(n => n.id !== noteId);
  GDrive.saveDriveNotes(filtered);
  return true;
}

// Clear all Google Drive synced notes
function clearAllDriveNotes() {
  if (typeof GDrive === 'undefined') return false;
  GDrive.saveDriveNotes([]);
  GDrive.saveConfig({ lastSyncCount: 0 });
  return true;
}

// Get merged posters
function getMergedPostersData() {
  const custom = getCustomPosters();
  if (custom && Array.isArray(custom) && custom.length > 0) {
    return custom;
  }
  return (typeof POSTERS_DATA !== 'undefined') ? POSTERS_DATA : [];
}

// Global Browser Window Bindings
if (typeof window !== 'undefined') {
  window.getMergedClassesData = getMergedClassesData;
  window.getMergedPostersData = getMergedPostersData;
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

