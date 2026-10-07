import { DiseaseItem, SubmissionRecord } from '../types';
import { INITIAL_DISEASE_ITEMS } from '../data/defaultCriteria';

const STORAGE_DISEASES_KEY = 'odpc1_jit_criteria_data_v3';
const STORAGE_SUBMISSIONS_KEY = 'odpc1_jit_submissions_history_v2';
const STORAGE_CURRENT_FEEDBACK_KEY = 'odpc1_jit_current_feedback_v2';
const STORAGE_CURRENT_RESPONDENT_KEY = 'odpc1_jit_current_respondent_v2';

export const loadDiseaseCriteria = (): DiseaseItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_DISEASES_KEY);
    if (!raw) {
      saveDiseaseCriteria(INITIAL_DISEASE_ITEMS);
      return INITIAL_DISEASE_ITEMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DISEASE_ITEMS;
  } catch (err) {
    console.error('Failed to load criteria from storage:', err);
    return INITIAL_DISEASE_ITEMS;
  }
};

export const saveDiseaseCriteria = (items: DiseaseItem[]): void => {
  try {
    localStorage.setItem(STORAGE_DISEASES_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save criteria to storage:', err);
  }
};

export const resetDiseaseCriteriaToDefault = (): DiseaseItem[] => {
  saveDiseaseCriteria(INITIAL_DISEASE_ITEMS);
  return INITIAL_DISEASE_ITEMS;
};

export const loadSubmissions = (): SubmissionRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_SUBMISSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load submissions:', err);
    return [];
  }
};

export const saveSubmission = (submission: SubmissionRecord): void => {
  const current = loadSubmissions();
  const updated = [submission, ...current];
  localStorage.setItem(STORAGE_SUBMISSIONS_KEY, JSON.stringify(updated));
};

export const loadDraftFeedback = () => {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveDraftFeedback = (feedback: Record<string, any>) => {
  localStorage.setItem(STORAGE_CURRENT_FEEDBACK_KEY, JSON.stringify(feedback));
};

export const loadDraftRespondent = () => {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_RESPONDENT_KEY);
    return raw ? JSON.parse(raw) : { fullName: '', positionOrg: '', email: '' };
  } catch {
    return { fullName: '', positionOrg: '', email: '' };
  }
};

export const saveDraftRespondent = (respondent: { fullName: string; positionOrg: string; email?: string }) => {
  localStorage.setItem(STORAGE_CURRENT_RESPONDENT_KEY, JSON.stringify(respondent));
};

/**
 * Download CSV with UTF-8 BOM so Thai text displays properly in Microsoft Excel
 */
export const downloadCsvFile = (filename: string, rows: string[][]) => {
  const processCell = (cell: string) => {
    if (cell === null || cell === undefined) return '""';
    const cellStr = String(cell).replace(/"/g, '""');
    return `"${cellStr}"`;
  };

  const csvContent = '\uFEFF' + rows.map((row) => row.map(processCell).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportComparisonCriteriaToCsv = (diseases: DiseaseItem[]) => {
  const rows: string[][] = [
    [
      'ลำดับ',
      'กลุ่มโรค',
      'ชื่อโรค/เหตุการณ์',
      'ชื่อภาษาอังกฤษ',
      'เกณฑ์ SAT ระดับ 1 (สคร.1 เชียงใหม่)',
      'เกณฑ์ SAT ระดับ 2 (SMEs ผู้เชี่ยวชาญ)',
      'เกณฑ์ SAT ระดับ 3 (DCIR กองระบาดวิทยา)',
      'ระดับ',
      'สถานะการเปลี่ยนแปลง',
      'เกณฑ์เดิม สคร.1 เชียงใหม่ (ธ.ค. 2568)',
      'เกณฑ์ใหม่ กองระบาดวิทยา (ก.ย. 2569)',
    ],
  ];

  diseases.forEach((d) => {
    d.levels.forEach((lvl) => {
      rows.push([
        String(d.no),
        d.groupName,
        d.name,
        d.nameEn || '',
        d.sat?.level1_odpc1 || '',
        d.sat?.level2_smes || '',
        d.sat?.level3_dcir || '',
        lvl.level,
        lvl.status,
        lvl.originalCriteria,
        lvl.newCriteria,
      ]);
    });
  });

  const now = new Date().toISOString().slice(0, 10);
  downloadCsvFile(`ตารางเปรียบเทียบเกณฑ์สอบสวนโรค_JIT_สคร1_${now}.csv`, rows);
};

export const exportSubmissionsToCsv = (
  submissions: SubmissionRecord[],
  diseases: DiseaseItem[]
) => {
  const diseaseMap = new Map<string, { disease: DiseaseItem; level: any }>();
  diseases.forEach((d) => {
    d.levels.forEach((l) => {
      diseaseMap.set(`${d.id}_${l.id}`, { disease: d, level: l });
    });
  });

  const rows: string[][] = [
    [
      'รหัสการส่ง',
      'วันเวลาที่บันทึก',
      'ชื่อ-นามสกุล ผู้แสดงความเห็น',
      'ตำแหน่ง/กลุ่มงาน/หน่วยงาน',
      'อีเมล',
      'กลุ่มโรค',
      'โรค/เหตุการณ์',
      'ระดับการออกสอบสวน',
      'สถานะเกณฑ์ (คงเดิม/ปรับเปลี่ยน)',
      'มติความคิดเห็น',
      'เกณฑ์เดิม สคร.1 (ธ.ค. 68)',
      'เกณฑ์ใหม่ กองระบาด (ก.ย. 69)',
      'ข้อเสนอแนะเพิ่มเติม/เสนอเกณฑ์ใหม่ (ผสมผสาน)',
    ],
  ];

  submissions.forEach((sub) => {
    const dateStr = new Date(sub.createdAt).toLocaleString('th-TH');
    Object.entries(sub.responses).forEach(([key, val]) => {
      const match = diseaseMap.get(key);
      if (!match) return;

      let choiceLabel = 'ไม่ได้ระบุ';
      if (val.choice === 'original') choiceLabel = 'คงเกณฑ์เดิม สคร.1 (ธ.ค. 68)';
      else if (val.choice === 'new') choiceLabel = 'ปรับตามร่างใหม่ (ก.ย. 69)';
      else if (val.choice === 'hybrid') choiceLabel = 'ปรับแก้แบบผสมผสาน (เสนอข้อความใหม่)';

      rows.push([
        sub.id,
        dateStr,
        sub.respondent.fullName || '-',
        sub.respondent.positionOrg || '-',
        sub.respondent.email || '-',
        match.disease.groupName,
        match.disease.name,
        match.level.level,
        match.level.status,
        choiceLabel,
        match.level.originalCriteria,
        match.level.newCriteria,
        val.comment || '',
      ]);
    });
  });

  const now = new Date().toISOString().slice(0, 10);
  downloadCsvFile(`ข้อมูลความคิดเห็น_JIT_สคร1_เชียงใหม่_${now}.csv`, rows);
};
