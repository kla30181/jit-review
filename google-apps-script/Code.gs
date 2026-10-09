/**
 * JIT Review - Firestore mirror receiver.
 * Script Properties required: FIREBASE_API_KEY, GOOGLE_SHEET_ID.
 * Deploy as Web App: Execute as Me, Access Anyone.
 * Every POST is authenticated using Firebase Identity Toolkit before writing.
 * No secret is stored in the Vite frontend.
 */
const HEADER = [
  'record_key','submission_id','created_at','full_name','position_org','email',
  'disease','group','level','status','choice','original_criteria','new_criteria','comment'
];

function doGet() {
  return json_({ ok: true, service: 'jit-review-mirror', note: 'POST requires Firebase ID token' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw Error('Empty request');
    const payload = JSON.parse(e.postData.contents);
    const token = String(payload.idToken || '');
    const user = verifyFirebaseToken_(token);
    if (!user.localId) throw Error('Invalid Firebase identity');
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    if (rows.length > 1000) throw Error('Too many rows');
    const submissionId = String(payload.submissionId || '');
    if (!/^[a-zA-Z0-9_-]{5,128}$/.test(submissionId)) throw Error('Invalid submission ID');
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const id = PropertiesService.getScriptProperties().getProperty('GOOGLE_SHEET_ID');
      if (!id) throw Error('Missing GOOGLE_SHEET_ID Script Property');
      const sheet = SpreadsheetApp.openById(id).getSheetByName('JIT Responses') || SpreadsheetApp.openById(id).insertSheet('JIT Responses');
      if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);
      const existing = new Set();
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues().forEach(r => existing.add(String(r[0])));
      }
      const batch = [];
      rows.forEach(r => {
        if (!r || r.submissionId !== submissionId) throw Error('Submission mismatch');
        const key = String(r.key || '');
        if (!key.startsWith(submissionId + '_') || key.length > 250) throw Error('Invalid record key');
        if (existing.has(key)) return;
        existing.add(key);
        const values = [key, submissionId, r.createdAt, r.fullName, r.positionOrg, user.email || '',
          r.disease, r.group, r.level, r.status, r.choice, r.originalCriteria, r.newCriteria, r.comment];
        batch.push(values.map(safeCell_));
      });
      if (batch.length) sheet.getRange(sheet.getLastRow()+1,1,batch.length,HEADER.length).setValues(batch);
      return json_({ ok: true, rowsAdded: batch.length });
    } finally { lock.releaseLock(); }
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error.message || error) });
  }
}

function verifyFirebaseToken_(token) {
  if (!token) throw Error('Missing Firebase ID token');
  const apiKey = PropertiesService.getScriptProperties().getProperty('FIREBASE_API_KEY');
  if (!apiKey) throw Error('Missing FIREBASE_API_KEY Script Property');
  const url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(apiKey);
  const response = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ idToken: token }), muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw Error('Firebase token rejected');
  const data = JSON.parse(response.getContentText());
  const user = data.users && data.users[0];
  if (!user || !user.localId || user.disabled) throw Error('User disabled or not found');
  return user;
}

function safeCell_(value) {
  const text = String(value == null ? '' : value).slice(0, 45000);
  // Prevent spreadsheet formula injection from untrusted user content.
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
