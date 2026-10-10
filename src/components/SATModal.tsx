import React from 'react';
import { X, Search, ShieldCheck, UserCheck, Globe2, MapPin } from 'lucide-react';
import { DiseaseItem } from '../types';
import { CriteriaBulletList } from './CriteriaBulletList';

interface SATModalProps {
  disease: DiseaseItem | null;
  onClose: () => void;
}

export const SATModal: React.FC<SATModalProps> = ({ disease, onClose }) => {
  if (!disease) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#991b1b] to-[#b91c1c] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="text-[13px] text-rose-200 font-medium">เกณฑ์ตรวจสอบข่าว SAT ครบทั้ง 3 ระดับ</div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {disease.name}
                {disease.nameEn && <span className="text-sm font-normal text-rose-100">({disease.nameEn})</span>}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Level 1: ODPC 1 Chiang Mai */}
          <div className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full pointer-events-none -z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-blue-950 font-bold text-[15px] sm:text-[16px] mb-1">
                <div className="p-1 rounded-lg bg-blue-100 text-blue-800">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="bg-blue-700 text-white text-[12px] px-2 py-0.5 rounded-md mr-1.5 font-bold shadow-2xs">
                    ระดับที่ 1
                  </span>
                  เกณฑ์ตรวจสอบข่าว สคร.1 เชียงใหม่
                </div>
              </div>
              <div className="text-[13px] font-semibold text-blue-800 mb-2 pl-7">
                (เฝ้าระวังเหตุการณ์ผิดปกติในเขตสุขภาพที่ 1 ภาคเหนือตอนบน 8 จังหวัด: เชียงใหม่ ลำพูน ลำปาง แพร่ น่าน พะเยา เชียงราย แม่ฮ่องสอน)
              </div>
              <div className="pl-3 sm:pl-7 bg-blue-50/70 p-3 rounded-lg border border-blue-200">
                <CriteriaBulletList text={disease.sat.level1_odpc1} />
              </div>
            </div>
          </div>

          {/* Level 2: SMEs */}
          <div className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full pointer-events-none -z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-purple-950 font-bold text-[15px] sm:text-[16px] mb-1">
                <div className="p-1 rounded-lg bg-purple-100 text-purple-800">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="bg-purple-700 text-white text-[12px] px-2 py-0.5 rounded-md mr-1.5 font-bold shadow-2xs">
                    ระดับที่ 2
                  </span>
                  เกณฑ์สำหรับ SMEs (Subject Matter Experts / ทีมผู้เชี่ยวชาญเฉพาะทาง)
                </div>
              </div>
              <div className="pl-3 sm:pl-7 bg-purple-50/70 p-3 rounded-lg border border-purple-200 mt-2">
                <CriteriaBulletList text={disease.sat.level2_smes} />
              </div>
            </div>
          </div>

          {/* Level 3: DCIR */}
          <div className="bg-white border-2 border-emerald-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full pointer-events-none -z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-[15px] sm:text-[16px] mb-1">
                <div className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                  <Globe2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="bg-emerald-700 text-white text-[12px] px-2 py-0.5 rounded-md mr-1.5 font-bold shadow-2xs">
                    ระดับที่ 3
                  </span>
                  เกณฑ์ DCIR (กองระบาดวิทยา กรมควบคุมโรค)
                </div>
              </div>
              <div className="pl-3 sm:pl-7 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 mt-2">
                <CriteriaBulletList text={disease.sat.level3_dcir} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[14px] text-slate-600 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            มาตรฐานการตรวจสอบข่าวสารระบาดวิทยา สคร.1 เชียงใหม่
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[15px] font-bold rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
