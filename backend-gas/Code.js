// =========================================================================
// GOOGLE APPS SCRIPT (GAS) AUTO-FOLDER ROUTER - SMP ANNIDA E-LEARNING
// Hierarki Folder Otomatis: /Materi/[Mata Pelajaran]/[Kelas]
// =========================================================================

/**
 * Helper mencari subfolder atau membuatnya jika belum ada
 * @param {GoogleAppsScript.Drive.Folder|GoogleAppsScript.Drive.DriveApp} parent
 * @param {string} folderName
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function getOrCreateFolder(parent, folderName) {
  var folders = parent.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parent.createFolder(folderName);
}

/**
 * Web App POST Endpoint: Menerima payload berkas materi & melakukan auto-routing
 * @param {Object} e - Event parameter dari HTTP POST
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Payload kosong atau format request tidak valid.");
    }

    var data = JSON.parse(e.postData.contents);
    var filename = data.filename || ("Materi_" + new Date().getTime());
    var mimeType = data.mimeType || "application/octet-stream";
    var base64 = data.base64;
    var subject = data.subject ? data.subject.trim() : "Umum";
    var className = data.className ? data.className.trim() : "Semua";

    if (!base64) {
      throw new Error("Data base64 berkas tidak ditemukan.");
    }

    // Decode file buffer
    var decoded = Utilities.base64Decode(base64);
    var blob = Utilities.newBlob(decoded, mimeType, filename);

    // Format folder kelas (misal "7A" -> "Kelas 7", "8B" -> "Kelas 8", "Semua" -> "Kelas Semua")
    var digitMatch = className.match(/\d+/);
    var classFolderName = digitMatch ? ("Kelas " + digitMatch[0]) : ("Kelas " + className);

    // Auto-Folder Routing Beruntun: /Materi/[Mata Pelajaran]/[Kelas]
    var rootFolder = getOrCreateFolder(DriveApp, "Materi");
    var subjectFolder = getOrCreateFolder(rootFolder, subject);
    var classFolder = getOrCreateFolder(subjectFolder, classFolderName);

    // Simpan file langsung ke dalam classFolder
    var file = classFolder.createFile(blob);
    
    // Aktifkan sharing view publik untuk akses siswa & guru
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      // Lewati jika domain Google Workspace membatasi sharing publik otomatis
    }

    var fileId = file.getId();
    var viewUrl = file.getUrl();
    var downloadUrl = file.getDownloadUrl ? file.getDownloadUrl() : ("https://drive.google.com/uc?export=download&id=" + fileId);
    var embedUrl = "https://drive.google.com/file/d/" + fileId + "/preview";

    var response = {
      status: "success",
      fileId: fileId,
      fileName: filename,
      folderPath: "/Materi/" + subject + "/" + classFolderName,
      viewUrl: viewUrl,
      downloadUrl: downloadUrl,
      embedUrl: embedUrl,
      uploadedAt: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    var errorResponse = {
      status: "error",
      message: err.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Web App GET Endpoint: Pemeriksaan status layanan (Health Check)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    service: "SMP Annida Google Drive Material Auto-Router",
    version: "1.0.0",
    hierarchy: "/Materi/[Mata Pelajaran]/[Kelas]"
  })).setMimeType(ContentService.MimeType.JSON);
}
