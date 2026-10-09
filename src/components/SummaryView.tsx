import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle2,
  Share2,
  ExternalLink,
  MessageSquare,
  History,
  FileCheck,
} from 'lucide-react';
import { DiseaseItem, SubmissionRecord } from '../types';
import {
  exportComparisonCriteriaToCsv,
  exportSubmissionsToCsv,
} from '../services/storageService';
import { User } from 'firebase/auth';

interface SummaryViewProps {
  diseases: DiseaseItem[];
  submissions: SubmissionRecord[];
  user: User | null;
  onSyncGoogleSheets: () => void;
  activeSheetUrl?: string | null;
  isSyncingSheets?: boolean;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  diseases,
  submissions,
  user,
  onSyncGoogleSheets,
  activeSheetUrl,
  isSyncingSheets = false,
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<'overview' | 'submissions' | 'suggestions'>('overview');

  // Calculate aggregated stats
  let totalResponses = 0;
  let originalCount = 0;
  let newCount = 0;
  let hybridCount = 0;

  const suggestions: Array<{
    respondentName: string;
    positionOrg: string;
    diseaseName: string;
    levelName: string;
    comment: string;
    date: string;
  }> = [];

  submissions.forEach((sub) => {
    Object.entries(sub.responses).forEach(([key, val]) => {
      totalResponses++;
      if (val.choice === 'original') originalCount++;
      else if (val.choice === 'new') newCount++;
      else if (val.choice === 'hybrid') {
        hybridCount++;
        if (val.comment && val.comment.trim()) {
          const parts = key.split('_');
          const disease = diseases.find((d) => d.id === parts[0]);
          const lvl = disease?.levels.find((l) => l.id === parts[1]);
          suggestions.push({
            respondentName: sub.respondent.fullName || 'ไม่ระบุชื่อ',
            positionOrg: sub.respondent.positionOrg || '-',
            diseaseName: disease?.name || 'ไม่ระบุโรค',
            levelName: lvl?.level || '-',
            comment: val.comment,
            date: new Date(sub.createdAt).toLocaleDateString('th-TH'),
          });
        }
      }
    });
  });

  const origPct = totalResponses > 0 ? Math.round((originalCount / totalResponses) * 100) : 0;
  const newPct = totalResponses > 0 ? Math.round((newCount / totalResponses) * 100) : 0;
  const hybridPct = totalResponses > 0 ? Math.round((hybridCount / totalResponses) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <FileCheck className="w-5 h-5" />
              </span>
              <span>สรุปผลการแสดงความคิดเห็นทบทวนเกณฑ์ JIT สคร.1 เชียงใหม่</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              รวบรวมมติความคิดเห็น ข้อเสนอแนะการปรับปรุงเกณฑ์ และส่งออกข้อมูลในรูปแบบไฟล์ Excel / CSV / Google Sheets
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportComparisonCriteriaToCsv(diseases)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
              title="ส่งออกตารางเปรียบเทียบเกณฑ์ฉบับเต็ม"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>ส่งออก Excel (ตารางเปรียบเทียบ)</span>
            </button>

            <button
              onClick={() => exportSubmissionsToCsv(submissions, diseases)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              title="ดาวน์โหลดไฟล์ความคิดเห็น UTF-8 BOM รองรับภาษาไทยใน Microsoft Excel"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>ดาวน์โหลดข้อมูลความคิดเห็น (CSV)</span>
            </button>

            <button
              onClick={onSyncGoogleSheets}
              disabled={isSyncingSheets}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#122344] hover:bg-[#1a3465] text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSyncingSheets ? 'กำลังบันทึกลงชีต...' : 'บันทึกลง Google Sheets'}</span>
            </button>
          </div>
        </div>

        {/* Connected Google Sheets Link if exists */}
        {activeSheetUrl && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                ลิงก์ <strong>Google Sheets สำเนาข้อมูล</strong> (ตรวจสอบผลซิงก์จาก Apps Script)
              </span>
            </div>
            <a
              href={activeSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 underline ml-2"
            >
              เปิดดู Google Sheet <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Respondents */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">ผู้ตอบแบบสอบถามทั้งหมด</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {submissions.length} <span className="text-xs font-normal text-slate-500">คน</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              รวมตอบ {totalResponses} ข้อ
            </div>
          </div>
        </div>

        {/* Option 1: คงเกณฑ์เดิม */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-extrabold text-sm">
            สคร.1
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-slate-500">คงเกณฑ์เดิม สคร.1</div>
            <div className="text-2xl font-extrabold text-blue-900 mt-0.5">
              {origPct}% <span className="text-xs font-normal text-slate-500">({originalCount} ข้อ)</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full" style={{ width: `${origPct}%` }}></div>
            </div>
          </div>
        </div>

        {/* Option 2: ปรับตามร่างใหม่ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-extrabold text-sm">
            ก.ย. 69
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-slate-500">ปรับตามร่างใหม่</div>
            <div className="text-2xl font-extrabold text-emerald-900 mt-0.5">
              {newPct}% <span className="text-xs font-normal text-slate-500">({newCount} ข้อ)</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${newPct}%` }}></div>
            </div>
          </div>
        </div>

        {/* Option 3: ผสมผสาน */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-extrabold text-sm">
            ผสม
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-slate-500">ปรับแก้แบบผสมผสาน</div>
            <div className="text-2xl font-extrabold text-amber-900 mt-0.5">
              {hybridPct}% <span className="text-xs font-normal text-slate-500">({hybridCount} ข้อ)</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${hybridPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 px-6 flex items-center gap-4">
          <button
            onClick={() => setSelectedSubTab('overview')}
            className={`py-3.5 text-[15px] font-bold border-b-2 transition-all cursor-pointer ${
              selectedSubTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            สรุปผลคะแนนแยกตามโรค ({diseases.length} โรค)
          </button>

          <button
            onClick={() => setSelectedSubTab('suggestions')}
            className={`py-3.5 text-[15px] font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedSubTab === 'suggestions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ข้อเสนอแนะผสมผสาน ({suggestions.length})</span>
          </button>

          <button
            onClick={() => setSelectedSubTab('submissions')}
            className={`py-3.5 text-[15px] font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedSubTab === 'submissions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>ประวัติผู้ส่งคำตอบ ({submissions.length})</span>
          </button>
        </div>

        <div className="p-6">
          {selectedSubTab === 'overview' && (
            <div className="overflow-x-auto">
              <table className="w-full text-[15px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[15px]">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">โรค / เหตุการณ์</th>
                    <th className="p-3">ระดับ</th>
                    <th className="p-3 text-center">สถานะ</th>
                    <th className="p-3 text-center">คงเกณฑ์เดิม สคร.1</th>
                    <th className="p-3 text-center">ปรับตามร่างใหม่</th>
                    <th className="p-3 text-center">ผสมผสาน</th>
                    <th className="p-3">แนวโน้มมติส่วนใหญ่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {diseases.map((d) =>
                    d.levels.map((lvl, lIdx) => {
                      const key = `${d.id}_${lvl.id}`;
                      let dOrig = 0;
                      let dNew = 0;
                      let dHyb = 0;

                      submissions.forEach((s) => {
                        const fb = s.responses[key];
                        if (fb?.choice === 'original') dOrig++;
                        else if (fb?.choice === 'new') dNew++;
                        else if (fb?.choice === 'hybrid') dHyb++;
                      });

                      const dTotal = dOrig + dNew + dHyb;
                      let majority = 'ยังไม่มีข้อมูล';
                      let majorityColor = 'text-slate-400 bg-slate-50';

                      if (dTotal > 0) {
                        if (dOrig >= dNew && dOrig >= dHyb) {
                          majority = 'คงเกณฑ์เดิม สคร.1';
                          majorityColor = 'text-blue-800 bg-blue-50 border-blue-200';
                        } else if (dNew >= dOrig && dNew >= dHyb) {
                          majority = 'ปรับตามร่างใหม่';
                          majorityColor = 'text-emerald-800 bg-emerald-50 border-emerald-200';
                        } else {
                          majority = 'ผสมผสาน';
                          majorityColor = 'text-amber-800 bg-amber-50 border-amber-200';
                        }
                      }

                      return (
                        <tr key={key} className="hover:bg-slate-50/60">
                          <td className="p-3 text-center text-slate-700 font-bold text-[15px]">
                            {lIdx === 0 ? d.no : ''}
                          </td>
                          <td className="p-3 font-bold text-slate-950 text-[16px]">
                            {lIdx === 0 ? d.name : ''}
                          </td>
                          <td className="p-3 text-slate-800 font-medium text-[15px]">{lvl.level}</td>
                          <td className="p-3 text-center">
                            {lvl.status === 'ปรับเปลี่ยน' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ปรับเปลี่ยน
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                คงเดิม
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center text-blue-700 font-bold text-[15px]">
                            {dOrig} ({dTotal > 0 ? Math.round((dOrig / dTotal) * 100) : 0}%)
                          </td>
                          <td className="p-3 text-center text-emerald-700 font-bold text-[15px]">
                            {dNew} ({dTotal > 0 ? Math.round((dNew / dTotal) * 100) : 0}%)
                          </td>
                          <td className="p-3 text-center text-amber-700 font-bold text-[15px]">
                            {dHyb} ({dTotal > 0 ? Math.round((dHyb / dTotal) * 100) : 0}%)
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[13px] font-bold border ${majorityColor}`}
                            >
                              {majority}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {selectedSubTab === 'suggestions' && (
            <div className="space-y-3">
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  ยังไม่มีข้อเสนอแนะเพิ่มเติมจากผู้ตอบแบบสอบถาม (ช่องผสมผสาน)
                </div>
              ) : (
                suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-slate-700 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-950">{s.diseaseName}</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-amber-300 text-[11px] text-amber-900">
                          ระดับ {s.levelName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{s.date}</span>
                    </div>

                    <p className="text-slate-900 font-medium bg-white p-3 rounded-lg border border-amber-200/80 leading-relaxed">
                      "{s.comment}"
                    </p>

                    <div className="text-[11px] text-slate-500 pt-1">
                      เสนอโดย: <strong>{s.respondentName}</strong> ({s.positionOrg})
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedSubTab === 'submissions' && (
            <div className="divide-y divide-slate-200">
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  ยังไม่มีข้อมูลผู้ส่งแบบสอบถาม
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {sub.respondent.fullName || 'ไม่ระบุชื่อ'}
                      </div>
                      <div className="text-slate-500">
                        {sub.respondent.positionOrg || 'ไม่ระบุตำแหน่ง'}
                      </div>
                    </div>

                    <div className="text-right sm:text-right">
                      <div className="text-slate-600 font-medium">
                        ตอบแล้ว {Object.keys(sub.responses).length} ข้อ
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(sub.createdAt).toLocaleString('th-TH')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
