/**
 * JIT ODPC1 - Google Sheet mirror endpoint
 * วิธีใช้: เปิด Google Sheet > Extensions > Apps Script > วางโค้ดนี้ > Deploy > Web app
 * Execute as: Me
 * Who has access: Anyone
 */

const SHEET_NAME = 'ผลการตอบแบบสอบถาม JIT';
const HEADERS = [
  'รหัสการส่ง',
  'วันเวลาที่ตอบ',
  'ชื่อ-นามสกุล',
  'ตำแหน่ง / หน่วยงาน',
  'อีเมลผู้ตอบ',
  'รหัสกลุ่ม',
  'กลุ่มโรค',
  'โรค / เหตุการณ์',
  'ระดับ',
  'สถานะเกณฑ์',
  'ความคิดเห็นที่เลือก',
  'เกณฑ์เดิม สคร.1 (ธ.ค. 68)',
  'เกณฑ์ใหม่ กองระบาด (ก.ย. 69)',
  'ข้อเสนอแนะเพิ่มเติม / เกณฑ์เสนอใหม่',
];

function doGet() {
  return ContentService.createTextOutput('JIT Google Sheet mirror is ready.');
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.parameter && e.parameter.payload) || '{}');
    if (payload.action !== 'appendSubmission' || !Array.isArray(payload.rows)) {
      throw new Error('Invalid payload');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    }

    // กันการ sync submission เดิมซ้ำ: ถ้ามี submissionId ในคอลัมน์ A แล้วไม่เพิ่มซ้ำ
    const submissionId = String(payload.submissionId || '');
    if (submissionId && sheet.getLastRow() > 1) {
      const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().map(String);
      if (ids.includes(submissionId)) {
        return json_({ ok: true, duplicate: true, rowsAdded: 0 });
      }
    }

    if (payload.rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, payload.rows.length, HEADERS.length)
        .setValues(payload.rows);
    }

    return json_({ ok: true, rowsAdded: payload.rows.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
