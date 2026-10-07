export type LevelName = 'อำเภอ/ศบส.' | 'จังหวัด/กทม.' | 'เขต' | 'ส่วนกลาง' | string;
export type CriteriaStatus = 'คงเดิม' | 'ปรับเปลี่ยน';

export interface LevelCriterion {
  id: string;
  level: LevelName;
  originalCriteria: string; // เกณฑ์เดิม สคร.1 (ธ.ค. 2568)
  newCriteria: string;      // เกณฑ์ใหม่ กองระบาดวิทยา (ก.ย. 2569)
  status: CriteriaStatus;   // คงเดิม หรือ ปรับเปลี่ยน
}

export interface SATCriteria {
  level1_odpc1: string; // ระดับที่ 1 เกณฑ์ตรวจสอบข่าว สคร.1 เชียงใหม่
  level2_smes: string;  // ระดับที่ 2 เกณฑ์สำหรับ SMEs (Subject Matter Experts / ทีมผู้เชี่ยวชาญ)
  level3_dcir: string;  // ระดับที่ 3 เกณฑ์ DCIR (กองระบาดวิทยา กรมควบคุมโรค)
}

export interface DiseaseItem {
  id: string;
  no: number;
  name: string;
  nameEn?: string;
  groupId: string;
  groupName: string;
  sat: SATCriteria;
  levels: LevelCriterion[];
}

export interface DiseaseGroup {
  id: string;
  name: string;
  order: number;
}

export type FeedbackChoice = 'original' | 'new' | 'hybrid';

export interface LevelFeedback {
  choice: FeedbackChoice;
  comment?: string; // ข้อเสนอแนะกรณีเลือกผสมผสาน หรือเหตุผลประกอบ
}

export interface RespondentInfo {
  fullName: string;
  positionOrg: string;
  email?: string;
}

export interface SubmissionRecord {
  id: string;
  respondent: RespondentInfo;
  responses: Record<string, LevelFeedback>; // key: `${diseaseId}_${levelId}`
  createdAt: string;
  syncedToGoogleSheet?: boolean;
  googleSheetUrl?: string;
}
