/**
 * JIT Review: Firebase-authenticated Google Sheets receiver.
 * Script Properties: FIREBASE_API_KEY, GOOGLE_SHEET_ID.
 * Deploy Web app: Execute as Me; access Anyone (endpoint verifies Firebase token).
 * Run testSheetConnection() in the Apps Script editor FIRST to validate Sheet permissions.
 */
const HEADER = [
  'record_key','submission_id','created_at','full_name','position_org','email',
  'disease','group','level','status','choice','original_criteria','new_criteria','comment'
];
const TAB_NAME = 'JIT Responses';

function doGet() {
  return json_({ ok: true, service: 'jit-review-mirror', note: 'POST with Firebase ID token required' });
}

/** Run from Apps Script editor: verifies ID, access, and header creation. */
function testSheetConnection() {
  const sheet = openSheet_();
  const result = { ok: true, spreadsheetName: sheet.getParent().getName(), tab: sheet.getName(), lastRow: sheet.getLastRow() };
  console.log(JSON.stringify(result));
  return result;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw Error('Empty request body');
    const payload = JSON.parse(e.postData.contents);
    const user = verifyFirebaseToken_(String(payload.idToken || ''));
    const submissionId = String(payload.submissionId || '');
    if (!/^[a-zA-Z0-9_-]{5,128}$/.test(submissionId)) throw Error('Invalid submission ID');
    if (!Array.isArray(payload.rows)) throw Error('rows must be an array');
    if (payload.rows.length > 1000) throw Error('Too many rows');
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const sheet = openSheet_();
      const existing = new Set();
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 1).getValues().forEach(r => existing.add(String(r[0])));
      const batch = [];
      payload.rows.forEach(r => {
        if (!r || r.submissionId !== submissionId) throw Error('Submission mismatch');
        const key = String(r.key || '');
        if (!key.startsWith(submissionId + '_') || key.length > 250) throw Error('Invalid record key');
        if (existing.has(key)) return;
        existing.add(key);
        batch.push([
          key, submissionId, r.createdAt, r.fullName, r.positionOrg, user.email || '',
          r.disease, r.group, r.level, r.status, r.choice, r.originalCriteria, r.newCriteria, r.comment
        ].map(safeCell_));
      });
      if (batch.length) sheet.getRange(sheet.getLastRow() + 1, 1, batch.length, HEADER.length).setValues(batch);
      SpreadsheetApp.flush();
      console.log(JSON.stringify({ event: 'sheet_sync', submissionId, uid: user.localId, received: payload.rows.length, added: batch.length }));
      return json_({ ok: true, received: payload.rows.length, rowsAdded: batch.length });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error('JIT sync failed: ' + String(error && error.stack || error));
    return json_({ ok: false, error: String(error && error.message || error) });
  }
}

function openSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('GOOGLE_SHEET_ID');
  if (!id) throw Error('Missing GOOGLE_SHEET_ID in Apps Script Project Settings > Script Properties');
  const book = SpreadsheetApp.openById(id.trim());
  const sheet = book.getSheetByName(TAB_NAME) || book.insertSheet(TAB_NAME);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
  return sheet;
}

function verifyFirebaseToken_(token) {
  if (!token) throw Error('Missing Firebase ID token');
  const apiKey = PropertiesService.getScriptProperties().getProperty('FIREBASE_API_KEY');
  if (!apiKey) throw Error('Missing FIREBASE_API_KEY in Apps Script Script Properties');
  const response = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey), {
    method: 'post', contentType: 'application/json', payload: JSON.stringify({ idToken: token }), muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw Error('Firebase token rejected (HTTP ' + response.getResponseCode() + ')');
  const data = JSON.parse(response.getContentText());
  const user = data.users && data.users[0];
  if (!user || !user.localId || user.disabled) throw Error('Firebase user disabled or not found');
  return user;
}

function safeCell_(value) {
  const text = String(value == null ? '' : value).slice(0, 45000);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
