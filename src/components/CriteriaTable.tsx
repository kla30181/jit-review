import React, { useState } from 'react';
import { Search, Edit3, CheckCircle2, FileSpreadsheet, ExternalLink, RotateCcw } from 'lucide-react';
import { DiseaseItem, LevelFeedback, FeedbackChoice } from '../types';
import { CriteriaBulletList } from './CriteriaBulletList';

interface CriteriaTableProps {
  diseases: DiseaseItem[];
  feedback: Record<string, LevelFeedback>;
  onSelectChoice: (diseaseId: string, levelId: string, choice: FeedbackChoice) => void;
  onCommentChange: (diseaseId: string, levelId: string, comment: string) => void;
  onOpenSATModal: (disease: DiseaseItem) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  onConnectAndOpenSheet?: () => void;
  activeSheetUrl?: string | null;
  lastSavedTime?: string;
  onClearResponses?: () => void;
}

export const CriteriaTable: React.FC<CriteriaTableProps> = ({
  diseases,
  feedback,
  onSelectChoice,
  onCommentChange,
  onOpenSATModal,
  onSubmit,
  isSubmitting = false,
  onConnectAndOpenSheet,
  activeSheetUrl,
  lastSavedTime,
  onClearResponses,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const getLevelBg = (levelName: string) => {
    if (levelName.includes('อำเภอ')) return 'bg-slate-50/80';
    if (levelName.includes('จังหวัด')) return 'bg-blue-50/40';
    if (levelName.includes('เขต')) return 'bg-amber-50/50';
    if (levelName.includes('ส่วนกลาง')) return 'bg-emerald-50/40';
    return 'bg-white';
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mb-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13.5px] min-w-[1050px] table-fixed">
          {/* Header */}
          <thead>
            <tr className="border-b-2 border-slate-300 font-bold text-slate-900 text-center text-[13px] sm:text-[13.5px]">
              <th className="w-[4%] min-w-[45px] p-2 bg-[#eef2f6] border-r border-slate-200">
                ที่
              </th>
              <th className="w-[13%] min-w-[135px] p-2 bg-[#f3efe6] border-r border-slate-200 text-left">
                โรค / เหตุการณ์
              </th>
              <th className="w-[18%] min-w-[185px] p-2 bg-[#fce7f3] text-rose-950 border-r border-rose-200 text-left">
                <div className="font-bold text-[13.5px] text-rose-950">
                  เกณฑ์ตรวจสอบข่าว SAT
                </div>
                <span className="block text-[11px] font-medium text-rose-800 mt-0.5">
                  (สคร.1 / SMEs / DCIR)
                </span>
              </th>
              <th className="w-[6%] min-w-[65px] p-2 bg-[#e0e7ff] text-indigo-950 border-r border-indigo-200">
                ระดับ
              </th>
              <th className="w-[18%] min-w-[185px] p-2 bg-[#fef3c7] text-amber-950 border-r border-amber-200 text-left">
                เกณฑ์เดิม สคร.1 (ธ.ค. 68)
              </th>
              <th className="w-[18%] min-w-[185px] p-2 bg-[#d1fae5] text-emerald-950 border-r border-emerald-200 text-left">
                เกณฑ์ใหม่ กองระบาดฯ (ก.ย. 69)
              </th>
              <th className="w-[6%] min-w-[65px] p-2 bg-[#ecfdf5] text-emerald-900 border-r border-slate-200">
                สถานะ
              </th>
              <th className="w-[17%] min-w-[185px] p-2 bg-[#fef9c3] text-amber-950 border-l-2 border-amber-400">
                <div className="text-center font-bold text-[13.5px] text-amber-950 mb-1">
                  ความคิดเห็นสำหรับการปรับข้อนี้ <span className="text-red-600 font-bold">*</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] font-bold text-slate-800 bg-white/95 p-1 rounded-lg border border-amber-300">
                  <div className="text-center py-0.5">
                    <div>คงเกณฑ์เดิม</div>
                    <span className="block text-[9.5px] text-slate-500 font-normal mt-0.5">(ธ.ค. 68)</span>
                  </div>
                  <div className="text-center py-0.5 border-x border-amber-200">
                    <div>ปรับร่างใหม่</div>
                    <span className="block text-[9.5px] text-slate-500 font-normal mt-0.5">(ก.ย. 69)</span>
                  </div>
                  <div className="text-center py-0.5">
                    <div>ผสมผสาน</div>
                    <span className="block text-[9.5px] text-slate-500 font-normal mt-0.5">(เสนอใหม่)</span>
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-200">
            {diseases.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 bg-slate-50 text-[15px] font-medium">
                  ไม่พบรายการโรคหรือเหตุการณ์ตามเงื่อนไขที่เลือก
                </td>
              </tr>
            ) : (
              diseases.map((disease) => {
                const totalLevels = disease.levels.length;

                return disease.levels.map((lvl, lvlIndex) => {
                  const key = `${disease.id}_${lvl.id}`;
                  const currentFeedback = feedback[key];
                  const choice = currentFeedback?.choice;
                  const isFirstRow = lvlIndex === 0;

                  return (
                    <tr
                      key={key}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        lvlIndex === totalLevels - 1 ? 'border-b-2 border-slate-300' : 'border-b border-slate-200'
                      }`}
                    >
                      {/* รายการที่ (Rowspan) */}
                      {isFirstRow && (
                        <td
                          rowSpan={totalLevels}
                          className="w-[4%] min-w-[45px] p-2 text-center font-bold text-slate-800 border-r border-slate-200 bg-slate-50/50 align-top"
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center mx-auto text-[13px] border border-slate-300">
                            {disease.no}
                          </div>
                        </td>
                      )}

                      {/* โรค / เหตุการณ์ (Rowspan) */}
                      {isFirstRow && (
                        <td
                          rowSpan={totalLevels}
                          className="w-[13%] min-w-[135px] p-2.5 border-r border-slate-200 align-top bg-white"
                        >
                          <div className="font-bold text-slate-900 text-[15px] leading-snug break-words">
                            {disease.name}
                          </div>
                          {disease.nameEn && (
                            <div className="text-[12px] text-slate-500 mt-0.5 leading-tight break-words">
                              ({disease.nameEn})
                            </div>
                          )}
                          <div className="mt-1.5">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {disease.groupName}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* เกณฑ์ตรวจสอบข่าว SAT (Rowspan) - Shows introductory preview in table + 3-level modal button */}
                      {isFirstRow && (
                        <td
                          rowSpan={totalLevels}
                          className="w-[18%] min-w-[185px] p-2.5 border-r border-slate-200 align-top bg-rose-50/20 text-left"
                        >
                          <div className="space-y-1.5">
                            {/* Header badge */}
                            <div className="flex items-center justify-between">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-blue-700 text-white font-bold text-[11px]">
                                ระดับ 1: สคร.1 เชียงใหม่
                              </span>
                              <span className="text-[10px] text-slate-500">ข้อความเบื้องต้น</span>
                            </div>

                            {/* Introductory SAT text preview in table */}
                            <div className="bg-white p-2 rounded-lg border border-rose-200/80 shadow-2xs text-[13px] text-slate-800 leading-relaxed max-h-[160px] overflow-y-auto scrollbar-thin">
                              <CriteriaBulletList text={disease.sat?.level1_odpc1 || 'เฝ้าระวังเหตุการณ์ผิดปกติในเขตสุขภาพที่ 1'} />
                            </div>

                            {/* Button to view all 3 SAT levels */}
                            <button
                              type="button"
                              onClick={() => onOpenSATModal(disease)}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11.5px] font-bold text-white bg-[#b91c1c] hover:bg-[#991b1b] shadow-2xs hover:shadow transition-all active:scale-95 cursor-pointer border border-red-700 text-center"
                              title="คลิกดูเกณฑ์ตรวจสอบข่าว SAT ทั้ง 3 ระดับ เพื่อดูข้อความเดิมเพิ่มเติม"
                            >
                              <Search className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />
                              <span>คลิกดูเกณฑ์ SAT 3 ระดับ เพิ่มเติม</span>
                            </button>
                          </div>
                        </td>
                      )}

                      {/* ระดับ */}
                      <td
                        className={`w-[6%] min-w-[65px] p-2 text-center font-bold text-slate-800 border-r border-slate-200 align-top ${getLevelBg(
                          lvl.level
                        )}`}
                      >
                        <span className="inline-block px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-300 font-bold text-[12px]">
                          {lvl.level}
                        </span>
                      </td>

                      {/* เกณฑ์เดิม สคร.1 (ธ.ค. 2568) - Formatted with multi-line bullets */}
                      <td className="w-[18%] min-w-[185px] p-2.5 text-slate-800 border-r border-slate-200 leading-relaxed bg-[#fffdf5] align-top text-[13.5px]">
                        <CriteriaBulletList text={lvl.originalCriteria} />
                      </td>

                      {/* เกณฑ์ใหม่ กองระบาดวิทยา (ก.ย. 2569) - Formatted with multi-line bullets */}
                      <td
                        className={`w-[18%] min-w-[185px] p-2.5 border-r border-slate-200 leading-relaxed align-top text-[13.5px] ${
                          lvl.status === 'ปรับเปลี่ยน'
                            ? 'bg-rose-50/40'
                            : 'bg-[#f6fef9]'
                        }`}
                      >
                        <CriteriaBulletList
                          text={lvl.newCriteria}
                          isChanged={lvl.status === 'ปรับเปลี่ยน'}
                        />
                      </td>

                      {/* สถานะ (คงเดิม / ปรับเปลี่ยน) */}
                      <td className="w-[6%] min-w-[65px] p-2 text-center border-r border-slate-200 align-top">
                        {lvl.status === 'ปรับเปลี่ยน' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ปรับเปลี่ยน
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                            คงเดิม
                          </span>
                        )}
                      </td>

                      {/* ความคิดเห็น (3 columns: คงเกณฑ์เดิม, ปรับตามร่างใหม่, ผสมผสาน) */}
                      <td className="w-[17%] min-w-[185px] p-2 border-l-2 border-amber-400 bg-amber-50/20 align-top">
                        <div className="grid grid-cols-3 gap-1">
                          {/* Option 1: คงเกณฑ์เดิม */}
                          <button
                            type="button"
                            onClick={() => onSelectChoice(disease.id, lvl.id, 'original')}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                              choice === 'original'
                                ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs ring-1 ring-blue-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mb-1 transition-colors ${
                                choice === 'original'
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {choice === 'original' && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className="text-[12px] font-bold leading-tight">
                              คงเกณฑ์เดิม
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 leading-none">
                              (สคร.1)
                            </span>
                          </button>

                          {/* Option 2: ปรับตามร่างใหม่ */}
                          <button
                            type="button"
                            onClick={() => onSelectChoice(disease.id, lvl.id, 'new')}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                              choice === 'new'
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs ring-1 ring-emerald-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mb-1 transition-colors ${
                                choice === 'new'
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {choice === 'new' && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className="text-[12px] font-bold leading-tight">
                              ปรับตามร่าง
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 leading-none">
                              (กองระบาดฯ)
                            </span>
                          </button>

                          {/* Option 3: ผสมผสาน */}
                          <button
                            type="button"
                            onClick={() => onSelectChoice(disease.id, lvl.id, 'hybrid')}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                              choice === 'hybrid'
                                ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-2xs ring-1 ring-amber-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mb-1 transition-colors ${
                                choice === 'hybrid'
                                  ? 'border-amber-600 bg-amber-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {choice === 'hybrid' && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className="text-[12px] font-bold leading-tight">
                              ผสมผสาน
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 leading-none">
                              (เสนอใหม่)
                            </span>
                          </button>
                        </div>

                        {/* Input Box for Hybrid choice */}
                        {choice === 'hybrid' && (
                          <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-300 animate-in fade-in duration-150">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900 mb-1">
                              <Edit3 className="w-3 h-3 text-amber-700 flex-shrink-0" />
                              <span>ระบุเกณฑ์ที่เสนอปรับแก้: <span className="text-red-500">*</span></span>
                            </div>
                            <textarea
                              rows={2}
                              value={currentFeedback?.comment || ''}
                              onChange={(e) => onCommentChange(disease.id, lvl.id, e.target.value)}
                              placeholder="พิมพ์เสนอข้อความเกณฑ์ใหม่ หรือเหตุผลประกอบ..."
                              className="w-full text-[12px] p-1.5 rounded border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
                            ></textarea>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                });
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Action footer */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center gap-2 text-[15px] font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>จัดเก็บข้อมูลอัตโนมัติแล้ว (Auto-saved) • ไม่สูญหายเมื่อโหลดหน้าใหม่หรือ Refresh</span>
          </div>
          <div className="text-[13px] text-slate-500 font-medium">
            {lastSavedTime || 'ทุกการเลือกความคิดเห็นจะถูกบันทึกไว้ในระบบทันที และพร้อมส่งข้อมูลไปยัง Google Sheets'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onClearResponses && Object.keys(feedback).length > 0 && (
            <>
              {showConfirmClear ? (
                <div className="flex items-center gap-1.5 p-1 bg-amber-50 rounded-lg border border-amber-300">
                  <span className="text-[13px] text-amber-900 font-medium px-1">ยืนยันล้างคำตอบ?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearResponses();
                      setShowConfirmClear(false);
                    }}
                    className="px-2.5 py-1 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                  >
                    ล้าง
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(false)}
                    className="px-2.5 py-1 text-[13px] text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(true)}
                  className="flex items-center gap-1 px-3 py-2 text-[14px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="ล้างคำตอบเพื่อเริ่มทำใหม่"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างคำตอบ</span>
                </button>
              )}
            </>
          )}

          {/* Quick Google Sheets link button */}
          {onConnectAndOpenSheet && (
            <>
              {activeSheetUrl ? (
                <a
                  href={activeSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[13px] rounded-xl shadow-xs hover:shadow transition-all"
                  title="เปิดดูข้อมูลที่บันทึกใน Google Sheets"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>เปิด Google Sheet ทันที</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onConnectAndOpenSheet}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-xl shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
                  title="เชื่อมต่อและเปิด Google Sheet ทันที"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>ลิ้งค์ไปที่ Google Sheet ทันที</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-[14px] rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกและส่งข้อมูลความคิดเห็น'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
