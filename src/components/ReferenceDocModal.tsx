import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Search,
  Shield,
  Clock,
  Sparkles,
  FileText,
  Printer,
  ChevronRight,
} from 'lucide-react';
import {
  OFFICIAL_DOC_PRINCIPLES,
  OFFICIAL_DOC_SECTIONS,
} from '../data/officialDoc2568';

interface ReferenceDocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferenceDocModal: React.FC<ReferenceDocModalProps> = ({ isOpen, onClose }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'overview'>('table');

  if (!isOpen) return null;

  const filteredSections = OFFICIAL_DOC_SECTIONS.filter((sec) => {
    if (activeSectionId !== 'all' && sec.id !== activeSectionId) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchTitle = sec.title.toLowerCase().includes(term);
    const matchRow = sec.rows?.some(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.district.toLowerCase().includes(term) ||
        r.region.toLowerCase().includes(term) ||
        r.timeline.toLowerCase().includes(term)
    );
    return matchTitle || matchRow;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#0f244a] via-[#1a386b] to-[#122344] text-white px-6 py-4 flex items-center justify-between border-b border-blue-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center flex-shrink-0 shadow-inner">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-semibold border border-amber-400/30">
                เอกสารทางการ สคร.1 เชียงใหม่
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {OFFICIAL_DOC_PRINCIPLES.title}
              </h2>
              <p className="text-xs text-slate-300">
                {OFFICIAL_DOC_PRINCIPLES.organization} (ครอบคลุม 21 หน้าตามฉบับจริง)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-200 transition-colors"
              title="พิมพ์เอกสาร"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher & Search Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
          {/* View Modes */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              ตารางเกณฑ์ฉบับเต็ม (หน้า 3-21)
            </button>
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'overview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              หลักการ 6 ข้อ & จุดปรับปรุง (หน้า 1-2)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาข้อความในเอกสารจริง..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {viewMode === 'overview' ? (
            <div className="space-y-5">
              {/* Page 1: 6 Core Rules */}
              <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-3 pb-2 border-b border-blue-100">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>เงื่อนไขหลักการออกสอบสวนโรค 6 ข้อ (หน้า 1)</span>
                </div>
                <div className="space-y-2.5 text-slate-800 leading-relaxed pl-2">
                  {OFFICIAL_DOC_PRINCIPLES.mainRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 font-medium"
                    >
                      {rule}
                    </div>
                  ))}
                </div>
              </div>

              {/* Page 2: December 2568 Changes */}
              <div className="bg-white rounded-xl border border-amber-300 p-5 shadow-xs bg-gradient-to-br from-amber-50/40 to-orange-50/30">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm mb-3 pb-2 border-b border-amber-200">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>ฉบับปรับปรุง ธันวาคม 2568 มีการปรับเงื่อนไข ดังนี้ (หน้า 2)</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {OFFICIAL_DOC_PRINCIPLES.december2568Changes.map((ch) => (
                    <div
                      key={ch.no}
                      className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-1"
                    >
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[11px] flex items-center justify-center">
                          {ch.no}
                        </span>
                        <span>{ch.title}</span>
                      </div>
                      <p className="text-slate-700 pl-6 leading-relaxed">{ch.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category Quick Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setActiveSectionId('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeSectionId === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ทั้งหมด ({OFFICIAL_DOC_SECTIONS.length} หมวด)
                </button>
                {OFFICIAL_DOC_SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeSectionId === sec.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sec.title}
                  </button>
                ))}
              </div>

              {/* Sections & Tables */}
              {filteredSections.map((sec) => (
                <div
                  key={sec.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  <div className="bg-[#f1f5f9] px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{sec.title}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {sec.pageRange}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-center">
                          <th className="p-2.5 text-left w-52 border-r border-slate-200">โรค / รหัส</th>
                          <th className="p-2.5 w-44 bg-slate-50/80 border-r border-slate-200">อำเภอ/ศบส.</th>
                          <th className="p-2.5 w-48 bg-blue-50/40 border-r border-slate-200">จังหวัด/กทม.</th>
                          <th className="p-2.5 w-56 bg-amber-50/40 border-r border-slate-200 font-extrabold text-amber-950">
                            เขต (สคร.1)
                          </th>
                          <th className="p-2.5 w-52 bg-emerald-50/40 border-r border-slate-200">ส่วนกลาง</th>
                          <th className="p-2.5 w-48 bg-rose-50/30 text-rose-950">กำหนดเวลาลงสอบสวน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {sec.rows?.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/60 align-top">
                            <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200 bg-white">
                              {row.code && (
                                <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded mr-1">
                                  {row.code}
                                </span>
                              )}
                              <span>{row.name}</span>
                            </td>
                            <td className="p-2.5 text-slate-700 border-r border-slate-200 whitespace-pre-line leading-relaxed">
                              {row.district}
                            </td>
                            <td className="p-2.5 text-slate-700 border-r border-slate-200 whitespace-pre-line leading-relaxed bg-blue-50/10">
                              {row.province}
                            </td>
                            <td className="p-2.5 text-amber-950 font-medium border-r border-slate-200 whitespace-pre-line leading-relaxed bg-amber-50/30">
                              {row.region}
                            </td>
                            <td className="p-2.5 text-slate-700 border-r border-slate-200 whitespace-pre-line leading-relaxed bg-emerald-50/10">
                              {row.central}
                            </td>
                            <td className="p-2.5 text-slate-700 whitespace-pre-line leading-relaxed bg-rose-50/10">
                              <div className="flex items-start gap-1 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <span>{row.timeline}</span>
                              </div>
                              {row.note && (
                                <div className="mt-1.5 p-1 bg-amber-50 rounded text-[10px] text-amber-900 border border-amber-200">
                                  {row.note}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>อ้างอิงประกาศทางการ สคร.1 เชียงใหม่ ฉบับปรับปรุง ธันวาคม 2568</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
