import React from 'react';
import { ListFilter, Sparkles, Check } from 'lucide-react';
import { DISEASE_GROUPS } from '../data/defaultCriteria';

interface FilterBarProps {
  selectedGroupId: string | 'all';
  onlyChanged: boolean;
  onSelectGroup: (groupId: string | 'all') => void;
  onToggleChanged: () => void;
  changedCount: number;
  groupChangedCounts?: Record<string, number>;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedGroupId,
  onlyChanged,
  onSelectGroup,
  onToggleChanged,
  changedCount,
  groupChangedCounts = {},
}) => {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-2 sm:p-3 mb-5 overflow-hidden">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300">
        {/* All button */}
        <button
          onClick={() => onSelectGroup('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedGroupId === 'all'
              ? 'bg-[#183968] text-white shadow-2xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>ทั้งหมด</span>
        </button>

        {/* Special Filter: เกณฑ์ที่มีการเปลี่ยนแปลง (Toggle that works with all tabs) */}
        <button
          onClick={onToggleChanged}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
            onlyChanged
              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs ring-1 ring-amber-300'
              : 'bg-[#fef9c3] hover:bg-[#fef08a] text-amber-950 border-amber-300'
          }`}
          title="คลิกเพื่อเปิด/ปิด ตัวกรองเฉพาะเกณฑ์ที่มีการปรับเปลี่ยน"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-800 fill-amber-500" />
          <span>เกณฑ์ที่มีการเปลี่ยนแปลง</span>
          <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-amber-500 text-slate-950 font-bold ml-0.5">
            {changedCount}
          </span>
          {onlyChanged && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
        </button>

        <div className="h-5 w-px bg-slate-300 mx-1 flex-shrink-0" />

        {/* 13 Disease Group tabs - Synchronized with onlyChanged filter */}
        {DISEASE_GROUPS.map((group) => {
          const isActive = selectedGroupId === group.id;
          const groupHasChanges = (groupChangedCounts[group.id] || 0) > 0;
          const changedInThisGroup = groupChangedCounts[group.id] || 0;

          return (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-2xs ring-1 ring-blue-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium'
              }`}
            >
              <span>{group.name}</span>

              {/* Badge showing number of changed diseases in this group */}
              {groupHasChanges && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                    isActive
                      ? 'bg-amber-300 text-amber-950'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                  title={`กลุ่มนี้มีเกณฑ์ปรับเปลี่ยน ${changedInThisGroup} รายการ`}
                >
                  {changedInThisGroup}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
