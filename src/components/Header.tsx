import React from 'react';
import { FileText, Settings, BarChart3, BookOpen, FileSpreadsheet, CheckCircle2, Cloud } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'survey' | 'admin' | 'summary';
  setActiveTab: (tab: 'survey' | 'admin' | 'summary') => void;
  onOpenDocModal: () => void;
  user: User | null;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  activeSheetUrl?: string | null;
  cloudSyncStatus?: 'synced' | 'syncing' | 'local';
  lastCloudSyncTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenDocModal,
  user,
  isAdmin,
  onLogin,
  onLogout,
  activeSheetUrl,
  cloudSyncStatus = 'synced',
  lastCloudSyncTime,
}) => {
  return (
    <header className="bg-[#122344] text-white shadow-md border-b border-[#1e3a6d]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1b3464] border border-amber-400 flex items-center justify-center shadow-inner flex-shrink-0">
            <div className="relative">
              <span className="text-amber-400 font-extrabold text-xl leading-none">+</span>
              <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-[#122344]"></span>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[12px] font-medium border border-amber-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                ทีมปฏิบัติการสอบสวนโรค (JIT) สคร.1 เชียงใหม่
              </div>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${
                  cloudSyncStatus === 'synced'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/40 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}
                title="ระบบคลาวด์ซิงค์ข้อมูลอัตโนมัติ ทำให้ข้อมูลระหว่าง PC และโน๊ตบุคตรงกันแบบเรียลไทม์"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>
                  {cloudSyncStatus === 'synced'
                    ? 'คลาวด์ซิงค์เรียลไทม์ (PC ↔ โน๊ตบุค)'
                    : cloudSyncStatus === 'syncing'
                    ? 'กำลังเชื่อมต่อคลาวด์...'
                    : 'บันทึกในเครื่อง'}
                </span>
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              แบบทบทวนเงื่อนไขการออกสอบสวนโรค
            </h1>
            <p className="text-[13px] sm:text-[13.5px] text-slate-300 mt-0.5">
              เปรียบเทียบระหว่าง{' '}
              <span className="text-amber-300 font-medium underline decoration-amber-400/60 decoration-1">
                ฉบับปรับปรุง สคร.1 (ธ.ค. 2568)
              </span>{' '}
              กับ{' '}
              <span className="text-emerald-300 font-medium underline decoration-emerald-400/60 decoration-1">
                เกณฑ์ใหม่ กองระบาดวิทยา (ก.ย. 2569)
              </span>
            </p>
          </div>
        </div>

        {/* Navigation & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('survey')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-all ${
              activeTab === 'survey'
                ? 'bg-[#1e3f7c] text-white shadow border border-blue-400/40 ring-1 ring-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-[#1b3464]'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-400" />
            ผู้ตอบความคิดเห็น
          </button>

          {isAdmin && <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-[#1e3f7c] text-white shadow border border-blue-400/40 ring-1 ring-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-[#1b3464]'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-400" />
            จัดการเกณฑ์ (Admin)
          </button>}

          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-all ${
              activeTab === 'summary'
                ? 'bg-[#1e3f7c] text-white shadow border border-blue-400/40 ring-1 ring-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-[#1b3464]'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            สรุปผลความเห็น
          </button>

          <button
            onClick={onOpenDocModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-2xs"
          >
            <BookOpen className="w-4 h-4 text-slate-950" />
            เอกสารจริง (ธ.ค. 68)
          </button>

          {/* Google Sheets Sync status / sign-in */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
              {activeSheetUrl && (
                <a
                  href={activeSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[14px] font-bold transition-all shadow-sm"
                  title="เปิด Google Sheets ที่เชื่อมโยงทันที"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                  <span>ลิ้งค์ไปที่ Google Sheet</span>
                </a>
              )}
              <div className="text-right hidden sm:block">
                <div className="text-[14px] text-slate-200 font-medium truncate max-w-[130px]">
                  {user.displayName || user.email}
                </div>
                <div className="text-[12px] text-emerald-400 flex items-center justify-end gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> เชื่อม Sheets แล้ว
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-2.5 py-1 text-[13px] text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="ออกจากระบบ Google"
              >
                ออก
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-bold bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow-sm border border-slate-200"
              title="เข้าสู่ระบบ Google เพื่อบันทึกคำตอบลง Google Sheets"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.27-2.09 3.67-5.17 3.67-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.15C3.25 21.27 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.24c-.25-.72-.39-1.49-.39-2.24 0-.75.14-1.52.39-2.24V6.61H1.26C.46 8.23 0 10.06 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.73 1.26 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>ต่อ Google Sheets</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
