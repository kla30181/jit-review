
import type {
  DiseaseItem,
  SubmissionRecord,
} from "../types";

import { auth } from "./firebaseAuth";

// =====================================================
// TYPES
// =====================================================

export interface GoogleSheetSyncResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowsAdded: number;
  message?: string;
}

interface GoogleSheetRow {
  key: string;
  submissionId: string;
  createdAt: string;
  fullName: string;
  positionOrg: string;
  email: string;
  disease: string;
  group: string;
  level: string;
  status: string;
  choice: string;
  originalCriteria: string;
  newCriteria: string;
  comment: string;
}

// =====================================================
// CONFIGURATION
// =====================================================

const SHEET_ID =
  "1giInTIjHZVqtRshLfY1nF64M-7jB2y-TevL1XuypWDg";

const APPS_SCRIPT_URL =
  import.meta.env.VITE_APPS_SCRIPT_WEB_APP_URL?.trim() || "";

const GOOGLE_SHEET_URL =
  import.meta.env.VITE_GOOGLE_SHEET_URL?.trim() ||
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

// =====================================================
// COMPATIBILITY FUNCTIONS
// =====================================================

export const getSavedSheetId = (): string | null => {
  return SHEET_ID;
};

export const setSavedSheetId = (_id: string): void => {
  // Spreadsheet ID is configured centrally.
};

export const getConfiguredSheetUrl = (): string => {
  return GOOGLE_SHEET_URL;
};

// =====================================================
// VALIDATE ENDPOINT
// =====================================================

function getAppsScriptEndpoint(): string {
  if (
    !APPS_SCRIPT_URL ||
    !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(
      APPS_SCRIPT_URL
    )
  ) {
    throw new Error(
      "กรุณาตั้งค่า VITE_APPS_SCRIPT_WEB_APP_URL ให้เป็น URL /exec ของ Google Apps Script"
    );
  }

  return APPS_SCRIPT_URL;
}

// =====================================================
// BUILD RESPONSE ROWS
// =====================================================

function buildSubmissionRows(
  submission: SubmissionRecord,
  diseases: DiseaseItem[]
): GoogleSheetRow[] {
  const rows: GoogleSheetRow[] = [];

  for (const disease of diseases) {
    for (const level of disease.levels) {
      const responseKey = `${disease.id}_${level.id}`;
      const response = submission.responses[responseKey];

      if (!response?.choice) {
        continue;
      }

      rows.push({
        key: `${submission.id}_${disease.id}_${level.id}`,
        submissionId: submission.id,
        createdAt: submission.createdAt,
        fullName: submission.respondent.fullName || "",
        positionOrg: submission.respondent.positionOrg || "",
        email: submission.respondent.email || "",
        disease: disease.name || "",
        group: disease.groupName || "",
        level: String(level.level || ""),
        status: String(level.status || ""),
        choice: String(response.choice),
        originalCriteria: level.originalCriteria || "",
        newCriteria: level.newCriteria || "",
        comment: response.comment || "",
      });
    }
  }

  return rows;
}

// =====================================================
// GOOGLE SHEETS SYNC
// =====================================================

export async function appendResponsesToSheet(
  _unusedToken: string | null,
  submission: SubmissionRecord,
  allDiseases: DiseaseItem[]
): Promise<GoogleSheetSyncResult> {
  const endpoint = getAppsScriptEndpoint();

  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error(
      "กรุณาเข้าสู่ระบบ Firebase ก่อนซิงก์ข้อมูล"
    );
  }

  if (!submission.id) {
    throw new Error(
      "ไม่พบรหัสรายการแบบสอบถาม"
    );
  }

  if (!submission.responses) {
    throw new Error(
      "ไม่พบข้อมูลคำตอบที่ต้องการซิงก์"
    );
  }

  // -------------------------------------------------
  // PREPARE ROWS
  // -------------------------------------------------

  const rows = buildSubmissionRows(
    submission,
    allDiseases
  );

  if (rows.length === 0) {
    throw new Error(
      "ไม่พบรายการคำตอบที่เลือก จึงไม่สามารถส่งไป Google Sheets ได้"
    );
  }

  if (rows.length > 1000) {
    throw new Error(
      "จำนวนคำตอบเกิน 1,000 แถวต่อการส่งหนึ่งครั้ง"
    );
  }

  // -------------------------------------------------
  // GET FIREBASE ID TOKEN
  // -------------------------------------------------

  const idToken = await currentUser.getIdToken();

  // -------------------------------------------------
  // SEND REQUEST TO APPS SCRIPT
  // -------------------------------------------------

  const payload = {
    idToken,
    submissionId: submission.id,
    rows,
  };

  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    console.info(
      "[JIT Google Sheets] Request dispatched",
      {
        submissionId: submission.id,
        rowsSent: rows.length,
      }
    );

    // Apps Script response is opaque in no-cors mode.
    // We cannot confirm whether rows were written.
    return {
      success: false,
      spreadsheetId: SHEET_ID,
      spreadsheetUrl: GOOGLE_SHEET_URL,
      rowsAdded: 0,
      message:
        `ส่งคำขอซิงก์ ${rows.length} รายการไปยัง Google Apps Script แล้ว ` +
        "แต่ยังไม่สามารถยืนยันว่าบันทึกลง Google Sheets สำเร็จ",
    };
  } catch (error) {
    console.error(
      "[JIT Google Sheets] Request failed:",
      error
    );

    throw new Error(
      "ไม่สามารถส่งข้อมูลไป Google Apps Script ได้ กรุณาตรวจสอบการเชื่อมต่อและ Deployment"
    );
  }
}
