import type { DiseaseItem, SubmissionRecord } from '../types';
import { auth } from './firebaseAuth';

export interface GoogleSheetSyncResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowsAdded: number;
  message?: string;
}

export const getSavedSheetId = (): string | null => null;
export const setSavedSheetId = (_id: string): void => {};
export const getConfiguredSheetUrl = (): string => import.meta.env.VITE_GOOGLE_SHEET_URL?.trim() || '';

export async function appendResponsesToSheet(
  _unusedToken: string | null,
  submission: SubmissionRecord,
  allDiseases: DiseaseItem[],
): Promise<GoogleSheetSyncResult> {
  const endpoint = import.meta.env.VITE_APPS_SCRIPT_WEB_APP_URL?.trim();
  if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\//.test(endpoint)) {
    throw new Error('ยังไม่ได้ตั้งค่า VITE_APPS_SCRIPT_WEB_APP_URL');
  }
  if (!auth.currentUser) throw new Error('กรุณาเข้าสู่ระบบ Firebase ก่อนซิงก์ข้อมูล');
  const idToken = await auth.currentUser.getIdToken();
  const rows = allDiseases.flatMap(disease => disease.levels.flatMap(level => {
    const response = submission.responses[`${disease.id}_${level.id}`];
    if (!response?.choice) return [];
    return [{
      key: `${submission.id}_${disease.id}_${level.id}`,
      submissionId: submission.id,
      createdAt: submission.createdAt,
      fullName: submission.respondent.fullName,
      positionOrg: submission.respondent.positionOrg,
      email: submission.respondent.email || '',
      disease: disease.name,
      group: disease.groupName,
      level: level.level,
      status: level.status,
      choice: response.choice,
      originalCriteria: level.originalCriteria,
      newCriteria: level.newCriteria,
      comment: response.comment || '',
    }];
  }));
  // Google Apps Script Web Apps do not return readable CORS responses to ordinary browser fetch.
  // Opaque response only means the request was dispatched; it is NOT proof of a Sheets write.
  await fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ idToken, submissionId: submission.id, rows }),
  });
  return {
    success: false,
    spreadsheetId: '',
    spreadsheetUrl: getConfiguredSheetUrl(),
    rowsAdded: 0,
    message: 'ส่งคำขอซิงก์แล้ว แต่เบราว์เซอร์ไม่สามารถยืนยันผลการบันทึกใน Google Sheets ได้',
  };
}
