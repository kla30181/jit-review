import type { DiseaseItem, SubmissionRecord } from '../types';

const STORAGE_SHEET_ID_KEY = 'odpc1_jit_active_sheet_id';
const APPS_SCRIPT_URL = (import.meta.env.VITE_APPS_SCRIPT_WEB_APP_URL || '').trim();
const GOOGLE_SHEET_URL = (import.meta.env.VITE_GOOGLE_SHEET_URL || '').trim();

export interface GoogleSheetSyncResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowsAdded: number;
  message?: string;
}

function getSheetIdFromUrl(url: string): string {
  return url.match(/\/spreadsheets\/d\/([^/]+)/)?.[1] || '';
}

export const getSavedSheetId = (): string | null => {
  const fromEnv = getSheetIdFromUrl(GOOGLE_SHEET_URL);
  if (fromEnv) return fromEnv;
  return localStorage.getItem(STORAGE_SHEET_ID_KEY);
};

export const setSavedSheetId = (id: string) => {
  if (id) localStorage.setItem(STORAGE_SHEET_ID_KEY, id);
};

function requireAppsScript() {
  if (!APPS_SCRIPT_URL || !GOOGLE_SHEET_URL) {
    throw new Error(
      'ยังไม่ได้ตั้งค่า Google Sheet กรุณากำหนด VITE_APPS_SCRIPT_WEB_APP_URL และ VITE_GOOGLE_SHEET_URL'
    );
  }
}

function choiceText(choice?: string) {
  if (choice === 'original') return 'คงเกณฑ์เดิม สคร.1 (ธ.ค. 68)';
  if (choice === 'new') return 'ปรับตามร่างใหม่ (ก.ย. 69)';
  if (choice === 'hybrid') return 'ปรับแก้แบบผสมผสาน (เสนอข้อความใหม่)';
  return 'ไม่ได้ระบุ';
}

function buildRows(submission: SubmissionRecord, allDiseases: DiseaseItem[]) {
  const rows: any[][] = [];
  const timeFormatted = new Date(submission.createdAt).toLocaleString('th-TH');

  for (const disease of allDiseases) {
    for (const lvl of disease.levels) {
      const feedback = submission.responses[`${disease.id}_${lvl.id}`];
      if (!feedback) continue;
      rows.push([
        submission.id,
        timeFormatted,
        submission.respondent.fullName || '-',
        submission.respondent.positionOrg || '-',
        submission.respondent.email || '-',
        disease.groupId,
        disease.groupName,
        disease.name,
        lvl.level,
        lvl.status,
        choiceText(feedback.choice),
        lvl.originalCriteria,
        lvl.newCriteria,
        feedback.comment || '',
      ]);
    }
  }
  return rows;
}

async function postToAppsScript(payload: unknown) {
  requireAppsScript();
  const body = new URLSearchParams();
  body.set('payload', JSON.stringify(payload));

  // no-cors ทำให้เว็บ GitHub Pages ส่งข้อมูลไป Apps Script ได้โดยไม่ต้องเปิด Sheets API
  // response จะเป็น opaque จึงตรวจสอบผลการเขียนใน Sheet ไม่ได้
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body,
  });
}

export async function createNewSpreadsheet(_accessToken: string, _title?: string) {
  requireAppsScript();
  const id = getSheetIdFromUrl(GOOGLE_SHEET_URL);
  setSavedSheetId(id);
  return { id, url: GOOGLE_SHEET_URL };
}

export async function appendResponsesToSheet(
  _accessToken: string,
  submission: SubmissionRecord,
  allDiseases: DiseaseItem[],
  _customSpreadsheetId?: string
): Promise<GoogleSheetSyncResult> {
  const rows = buildRows(submission, allDiseases);
  const spreadsheetId = getSheetIdFromUrl(GOOGLE_SHEET_URL);

  if (rows.length > 0) {
    await postToAppsScript({
      action: 'appendSubmission',
      submissionId: submission.id,
      rows,
    });
  }

  setSavedSheetId(spreadsheetId);
  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl: GOOGLE_SHEET_URL,
    rowsAdded: rows.length,
    message: rows.length
      ? `ส่งข้อมูล ${rows.length} รายการไป Google Sheet แล้ว`
      : 'ไม่มีข้อมูลความคิดเห็นที่ต้องส่ง',
  };
}
