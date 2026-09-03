// =========================================================================
// GOOGLE APPS SCRIPT (GAS) AUTO-FOLDER ROUTER - SMP ANNIDA E-LEARNING
// Hierarki Folder Otomatis: /Materi/[Mata Pelajaran]/[Kelas]
// =========================================================================

/**
 * Fungsi Pengujian / Inisialisasi Manual dari Editor (Bisa di-klik "Jalankan")
 * Berfungsi untuk memicu otorisasi izin Drive dan membuat folder awal secara langsung.
 */
function testInitFolders() {
  var rootFolder = getOrCreateFolder(DriveApp, "Materi");
  var subjects = ["Matematika", "IPA", "IPS", "PAI", "Bahasa Indonesia", "Bahasa Inggris", "Bahasa Arab", "PJOK", "Informatika", "Seni Budaya", "PKn", "Tahfidz"];
  var classes = ["Kelas 7", "Kelas 8", "Kelas 9"];

  subjects.forEach(function(sub) {
    var subFolder = getOrCreateFolder(rootFolder, sub);
    classes.forEach(function(cls) {
      getOrCreateFolder(subFolder, cls);
    });
  });

  Logger.log("✅ Struktur folder /Materi/[Mata Pelajaran]/[Kelas 7, 8, 9] berhasil dibuat lengkap di Google Drive!");
}

/**
 * Helper mencari subfolder atau membuatnya jika belum ada
 * @param {GoogleAppsScript.Drive.Folder|GoogleAppsScript.Drive.DriveApp} parent
 * @param {string} folderName
 * @returns {GoogleAppsScript.Drive.Folder}
 */
function getOrCreateFolder(parent, folderName) {
  var p = parent || DriveApp;
  var folders = p.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : p.createFolder(folderName);
}

/**
 * Web App POST Endpoint: Menerima payload berkas materi & melakukan auto-routing atau penghapusan
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Payload kosong atau format request tidak valid.");
    }

    var data = JSON.parse(e.postData.contents);

    // =========================================================================
    // 0. GET HTML ACTION: Baca isi teks berkas HTML untuk Smart Viewer
    // =========================================================================
    if (data.action === "getHtml") {
      var targetId = data.fileId;
      if (!targetId && data.fileUrl) {
        var match = data.fileUrl.match(/[-\w]{25,}/);
        if (match) targetId = match[0];
      }

      if (!targetId) {
        throw new Error("ID atau URL berkas Google Drive tidak ditemukan.");
      }

      try {
        var htmlFile = DriveApp.getFileById(targetId);
        var htmlContent = htmlFile.getBlob().getDataAsString("UTF-8");

        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          fileId: targetId,
          fileName: htmlFile.getName(),
          html: htmlContent
        })).setMimeType(ContentService.MimeType.JSON);
      } catch (getErr) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Gagal membaca berkas HTML dari Google Drive: " + getErr.message
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // =========================================================================
    // 1. DELETE ACTION: Hapus Berkas dari Google Drive
    // =========================================================================
    if (data.action === "delete") {
      var targetId = data.fileId;
      if (!targetId && data.fileUrl) {
        var match = data.fileUrl.match(/[-\w]{25,}/);
        if (match) targetId = match[0];
      }

      if (!targetId) {
        throw new Error("ID atau URL berkas Google Drive tidak valid untuk dihapus.");
      }

      try {
        var fileToTrash = DriveApp.getFileById(targetId);
        fileToTrash.setTrashed(true);
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "delete",
          fileId: targetId,
          message: "Berkas berhasil dipindahkan ke Sampah Google Drive."
        })).setMimeType(ContentService.MimeType.JSON);
      } catch (delErr) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "warning",
          action: "delete",
          fileId: targetId,
          message: "Berkas tidak ditemukan atau sudah dihapus: " + delErr.message
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // =========================================================================
    // 2. UPLOAD ACTION: Unggah Berkas & Auto-Folder Routing
    // =========================================================================
    var filename = data.filename || ("Materi_" + new Date().getTime());
    var mimeType = data.mimeType || "application/octet-stream";
    var base64 = data.base64;
    var subject = data.subject ? data.subject.trim() : "Umum";
    var className = data.className ? data.className.trim() : "Semua";

    if (!base64) {
      throw new Error("Data base64 berkas tidak ditemukan.");
    }

    var decoded = Utilities.base64Decode(base64);
    var blob = Utilities.newBlob(decoded, mimeType, filename);

    // Format kelas (misal "7A" -> "Kelas 7", "8B" -> "Kelas 8")
    var digitMatch = className.match(/\d+/);
    var classFolderName = digitMatch ? ("Kelas " + digitMatch[0]) : ("Kelas " + className);

    // Auto-Folder Routing Beruntun: /Materi/[Mata Pelajaran]/[Kelas]
    var rootFolder = getOrCreateFolder(DriveApp, "Materi");
    var subjectFolder = getOrCreateFolder(rootFolder, subject);
    var classFolder = getOrCreateFolder(subjectFolder, classFolderName);

    var file = classFolder.createFile(blob);
    
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {}

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
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Web App GET Endpoint: Health check & HTML Proxy for Direct Execution
 */
function doGet(e) {
  try {
    var action = e && e.parameter && e.parameter.action;
    var fileId = e && e.parameter && e.parameter.fileId;
    var fileUrl = e && e.parameter && e.parameter.fileUrl;

    if (action === "getHtml") {
      var targetId = fileId;
      if (!targetId && fileUrl) {
        var match = fileUrl.match(/[-\w]{25,}/);
        if (match) targetId = match[0];
      }

      if (!targetId) {
        throw new Error("Parameter fileId atau fileUrl tidak ditemukan.");
      }

      var file = DriveApp.getFileById(targetId);
      var htmlContent = file.getBlob().getDataAsString("UTF-8");

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        fileId: targetId,
        fileName: file.getName(),
        html: htmlContent
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "active",
      service: "SMP Annida Google Drive Material Auto-Router",
      version: "1.1.0",
      hierarchy: "/Materi/[Mata Pelajaran]/[Kelas]"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
