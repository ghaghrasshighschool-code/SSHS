/**
 * ============================================================================
 * SS+2 HIGH SCHOOL GHAGHRA - GOOGLE DRIVE NOTES SYNC BACKEND
 * ============================================================================
 * 
 * Free, lightweight Google Apps Script that turns any Google Drive folder
 * into a live, secure JSON data source for the SSHS Notes PWA.
 * 
 * INSTRUCTIONS TO DEPLOY (takes 2 minutes):
 * 1. Go to https://script.google.com and click "+ New project".
 * 2. Delete any existing code, paste this entire file, and click Save (Ctrl+S).
 * 3. Replace "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE" below with your Google Drive Folder ID
 *    (e.g., in https://drive.google.com/drive/folders/1A2b3C... the ID is "1A2b3C...").
 * 4. Click the blue "Deploy" button at the top right -> "New deployment".
 * 5. Select type: "Web app" (click gear icon next to Select type).
 * 6. Set Description: "SSHS Notes API"
 * 7. Set "Execute as": "Me" (your email).
 * 8. Set "Who has access": "Anyone" (allows the school PWA to fetch the file list).
 * 9. Click "Deploy", authorize permissions when prompted, and copy the "Web app URL".
 * 10. Paste this URL into the SSHS Admin Portal under "Google Drive Sync". Done!
 * ============================================================================
 */

// Paste your Google Drive Folder ID here (or leave it to pass dynamically via ?folderId=...)
var DEFAULT_FOLDER_ID = "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE";

function doGet(e) {
  try {
    var folderId = (e && e.parameter && e.parameter.folderId) ? e.parameter.folderId : DEFAULT_FOLDER_ID;

    if (!folderId || folderId === "1bs-B8-2p1-Lw5Xu4MZe_2lkWJN2bLAda") {
      return createJsonResponse({
        status: "error",
        message: "No valid folder ID provided. Please set DEFAULT_FOLDER_ID in the script or pass ?folderId=..."
      });
    }

    var folder = DriveApp.getFolderById(folderId);
    var notes = [];

    // Recursive folder crawler supporting multi-level nested folders:
    // e.g. SSHSGHAGHRA NOTES > IT/ITES > DDEO (Class 9, Class 10, COMMON, QUESTIONS)
    //                                  > JSD  (Class 11, Class 12, COMMON, QUESTIONS)
    //                                  > BOOKS, HTML NOTES, ExtraS, ALL CLASSES
    function scanFolder(currentFolder, path) {
      // 1. Scan files in current folder
      var files = currentFolder.getFiles();
      while (files.hasNext()) {
        var file = files.next();
        var mimeType = file.getMimeType();
        var name = file.getName();

        if (mimeType === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
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

      // 2. Recursively scan child subfolders
      var subfolders = currentFolder.getFolders();
      while (subfolders.hasNext()) {
        var sub = subfolders.next();
        var newPath = path ? (path + " / " + sub.getName()) : sub.getName();
        scanFolder(sub, newPath);
      }
    }

    // Start recursive scan from the root folder
    scanFolder(folder, folder.getName());

    var responseData = {
      status: "success",
      folderName: folder.getName(),
      totalFiles: notes.length,
      syncedAt: Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm a"),
      files: notes
    };

    return createJsonResponse(responseData);

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

// Format bytes into readable KB/MB
function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return "0 B";
  var k = 1024;
  var sizes = ["B", "KB", "MB", "GB"];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// JSON Output Helper
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

