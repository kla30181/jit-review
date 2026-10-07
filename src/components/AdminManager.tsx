import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Search,
  CheckCircle,
  AlertTriangle,
  FolderPlus,
  AlertCircle,
  X,
  ArrowUp,
  ArrowDown,
  ListOrdered,
} from 'lucide-react';
import { DiseaseItem, LevelCriterion, LevelName, CriteriaStatus } from '../types';
import { DISEASE_GROUPS } from '../data/defaultCriteria';
import { SATModal } from './SATModal';

interface AdminManagerProps {
  diseases: DiseaseItem[];
  onSaveDiseases: (items: DiseaseItem[]) => void;
  onResetDefault: () => void;
}

const STANDARD_LEVEL_OPTIONS: LevelName[] = [
  'อำเภอ/ศบส.',
  'จังหวัด/กทม.',
  'เขต',
  'ส่วนกลาง',
];

export const AdminManager: React.FC<AdminManagerProps> = ({
  diseases,
  onSaveDiseases,
  onResetDefault,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [editingDisease, setEditingDisease] = useState<DiseaseItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewSatDisease, setPreviewSatDisease] = useState<DiseaseItem | null>(null);
  const [autoShiftOrder, setAutoShiftOrder] = useState<boolean>(true);

  // In-app deletion and reset confirmation states (avoids blocked window.confirm in iframe)
  const [diseaseToDelete, setDiseaseToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [levelError, setLevelError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredDiseases = diseases.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.nameEn && d.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.groupName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = selectedGroupFilter === 'all' || d.groupId === selectedGroupFilter;
    return matchSearch && matchGroup;
  });

  const handleOpenAddModal = () => {
    const newId = `d-${Date.now()}`;
    const nextNo = diseases.length > 0 ? Math.max(...diseases.map((d) => d.no)) + 1 : 1;
    const defaultGroup = DISEASE_GROUPS[0];

    const newDisease: DiseaseItem = {
      id: newId,
      no: nextNo,
      name: '',
      nameEn: '',
      groupId: defaultGroup.id,
      groupName: defaultGroup.name,
      sat: {
        level1_odpc1: 'เฝ้าระวังเหตุการณ์ผิดปกติในเขตสุขภาพที่ 1 ภาคเหนือตอนบน 8 จังหวัด (เชียงใหม่ ลำพูน ลำปาง แพร่ น่าน พะเยา เชียงราย แม่ฮ่องสอน)',
        level2_smes: 'ทีมผู้เชี่ยวชาญเฉพาะทางร่วมประเมินและให้คำแนะนำ',
        level3_dcir: 'กองระบาดวิทยา กรมควบคุมโรค ประเมินสถานการณ์ระดับประเทศ',
      },
      levels: [
        {
          id: `l-${Date.now()}-1`,
          level: 'อำเภอ/ศบส.',
          originalCriteria: 'ตั้งแต่ผู้ป่วยเข้าเกณฑ์สอบสวนโรค (PUI) ทุกราย',
          newCriteria: 'ตั้งแต่ผู้ป่วยเข้าเกณฑ์สอบสวนโรค (PUI) ทุกราย',
          status: 'คงเดิม',
        },
        {
          id: `l-${Date.now()}-2`,
          level: 'จังหวัด/กทม.',
          originalCriteria: 'ตั้งแต่ผู้ป่วยเข้าเกณฑ์สอบสวนโรค (PUI) ทุกราย',
          newCriteria: 'ตั้งแต่ผู้ป่วยเข้าเกณฑ์สอบสวนโรค (PUI) ทุกราย',
          status: 'คงเดิม',
        },
        {
          id: `l-${Date.now()}-3`,
          level: 'เขต',
          originalCriteria: 'ตั้งแต่ผู้ป่วยเข้าเกณฑ์สอบสวนโรค (PUI) ทุกราย',
          newCriteria: 'ตั้งแต่ผู้ป่วยเข้าเกณฑ์สอบสวนโรค (PUI) ทุกราย',
          status: 'คงเดิม',
        },
        {
          id: `l-${Date.now()}-4`,
          level: 'ส่วนกลาง',
          originalCriteria: 'ตั้งแต่ผู้ป่วยเข้าเกณฑ์สอบสวนโรค (PUI) ทุกราย',
          newCriteria: 'ตั้งแต่ผู้ป่วยเข้าเกณฑ์สอบสวนโรค (PUI) ทุกราย',
          status: 'คงเดิม',
        },
      ],
    };

    setEditingDisease(newDisease);
    setIsCreatingNew(true);
    setLevelError(null);
  };

  const handleOpenEditModal = (disease: DiseaseItem) => {
    const clone: DiseaseItem = JSON.parse(JSON.stringify(disease));
    if (!clone.sat) {
      clone.sat = {
        level1_odpc1: '',
        level2_smes: '',
        level3_dcir: '',
      };
    } else {
      clone.sat.level1_odpc1 = clone.sat.level1_odpc1 || '';
      clone.sat.level2_smes = clone.sat.level2_smes || '';
      clone.sat.level3_dcir = clone.sat.level3_dcir || '';
    }
    setEditingDisease(clone);
    setIsCreatingNew(false);
    setLevelError(null);
  };

  // Trigger in-app deletion confirmation
  const handleRequestDelete = (id: string, name: string) => {
    setDiseaseToDelete({ id, name });
  };

  // Perform actual deletion
  const handleConfirmDelete = () => {
    if (!diseaseToDelete) return;
    const targetId = diseaseToDelete.id;
    const targetName = diseaseToDelete.name;

    const updated = diseases.filter((d) => d.id !== targetId);
    updated.sort((a, b) => a.no - b.no);
    onSaveDiseases(updated);
    showToast(`ลบรายการ "${targetName}" สำเร็จเรียบร้อย`);
    setDiseaseToDelete(null);
    if (editingDisease?.id === targetId) {
      setEditingDisease(null);
    }
  };

  const handleAddLevel = () => {
    if (!editingDisease) return;
    const newLvl: LevelCriterion = {
      id: `l-${Date.now()}-${editingDisease.levels.length + 1}`,
      level: 'อำเภอ/ศบส.',
      originalCriteria: '',
      newCriteria: '',
      status: 'คงเดิม',
    };
    setEditingDisease({
      ...editingDisease,
      levels: [...editingDisease.levels, newLvl],
    });
    setLevelError(null);
  };

  const handleRemoveLevel = (levelId: string) => {
    if (!editingDisease) return;
    if (editingDisease.levels.length <= 1) {
      setLevelError('โรค/เหตุการณ์ต้องมีอย่างน้อย 1 ระดับ ไม่สามารถลบได้');
      setTimeout(() => setLevelError(null), 3000);
      return;
    }
    setEditingDisease({
      ...editingDisease,
      levels: editingDisease.levels.filter((l) => l.id !== levelId),
    });
    setLevelError(null);
  };

  const handleLevelChange = (levelId: string, field: keyof LevelCriterion, val: string) => {
    if (!editingDisease) return;
    setEditingDisease({
      ...editingDisease,
      levels: editingDisease.levels.map((l) => (l.id === levelId ? { ...l, [field]: val } : l)),
    });
  };

  // Move item up or down in sequence directly from list
  const handleMoveOrder = (diseaseId: string, direction: 'up' | 'down') => {
    const sorted = [...diseases].sort((a, b) => a.no - b.no);
    const index = sorted.findIndex((d) => d.id === diseaseId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sorted.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = sorted[index];
    sorted[index] = sorted[targetIndex];
    sorted[targetIndex] = temp;

    const updated = sorted.map((d, i) => ({ ...d, no: i + 1 }));
    onSaveDiseases(updated);
    showToast(`ย้าย "${temp.name}" เป็นลำดับที่ ${targetIndex + 1} เรียบร้อยแล้ว`);
  };

  // Quick jump sequence from card dropdown
  const handleQuickChangeOrder = (diseaseId: string, newNoStr: string) => {
    const targetNo = parseInt(newNoStr, 10);
    if (isNaN(targetNo) || targetNo < 1) return;

    const targetDisease = diseases.find((d) => d.id === diseaseId);
    if (!targetDisease) return;

    const sortedWithout = diseases
      .filter((d) => d.id !== diseaseId)
      .sort((a, b) => a.no - b.no);
    const insertIdx = Math.min(Math.max(0, targetNo - 1), sortedWithout.length);
    sortedWithout.splice(insertIdx, 0, targetDisease);
    const updated = sortedWithout.map((d, i) => ({ ...d, no: i + 1 }));
    onSaveDiseases(updated);
    showToast(`เปลี่ยนลำดับ "${targetDisease.name}" เป็นลำดับที่ ${insertIdx + 1} สำเร็จ`);
  };

  const handleSaveModal = () => {
    if (!editingDisease) return;
    if (!editingDisease.name.trim()) {
      setLevelError('กรุณากรอกชื่อโรค / เหตุการณ์');
      return;
    }

    const sanitizedNo = Math.max(1, Number(editingDisease.no) || 1);
    const itemToSave: DiseaseItem = { ...editingDisease, no: sanitizedNo };

    let updatedList: DiseaseItem[];
    if (isCreatingNew) {
      if (autoShiftOrder) {
        // Shift mode: insert at position and renumber cleanly 1..N
        const sorted = [...diseases].sort((a, b) => a.no - b.no);
        const insertIdx = Math.min(Math.max(0, sanitizedNo - 1), sorted.length);
        sorted.splice(insertIdx, 0, itemToSave);
        updatedList = sorted.map((item, idx) => ({ ...item, no: idx + 1 }));
      } else {
        updatedList = [...diseases, itemToSave].sort((a, b) => a.no - b.no);
      }
    } else {
      if (autoShiftOrder) {
        // Shift mode: move item to target position and renumber cleanly 1..N
        const sortedWithout = diseases
          .filter((d) => d.id !== itemToSave.id)
          .sort((a, b) => a.no - b.no);
        const insertIdx = Math.min(Math.max(0, sanitizedNo - 1), sortedWithout.length);
        sortedWithout.splice(insertIdx, 0, itemToSave);
        updatedList = sortedWithout.map((item, idx) => ({ ...item, no: idx + 1 }));
      } else {
        updatedList = diseases
          .map((d) => (d.id === itemToSave.id ? itemToSave : d))
          .sort((a, b) => a.no - b.no);
      }
    }

    onSaveDiseases(updatedList);
    setEditingDisease(null);
    showToast(
      isCreatingNew
        ? `เพิ่มรายการโรคใหม่ ลำดับที่ ${sanitizedNo} เรียบร้อยแล้ว`
        : `บันทึกการแก้ไขเกณฑ์ ลำดับที่ ${sanitizedNo} เรียบร้อยแล้ว`
    );
  };

  const handleConfirmReset = () => {
    onResetDefault();
    setIsConfirmingReset(false);
    showToast('คืนค่าเกณฑ์มาตรฐานเรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Control Toolbar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Edit2 className="w-5 h-5" />
              </span>
              <span>จัดการเกณฑ์เงื่อนไขการออกสอบสวนโรค (Admin Mode)</span>
            </div>
            <p className="text-[15px] text-slate-600 mt-1 leading-relaxed">
              ปรับปรุง เพิ่มเติม เลือกลำดับที่ หรือลบรายการโรคและเกณฑ์เงื่อนไขในแต่ละระดับ (อำเภอ, จังหวัด, เขต, ส่วนกลาง) ได้อย่างอิสระ ข้อมูลจะบันทึกลงฐานข้อมูลถาวร
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[15px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มรายการโรค / เหตุการณ์ใหม่</span>
            </button>

            <button
              onClick={() => setIsConfirmingReset(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[14px] font-semibold border border-slate-200 transition-colors cursor-pointer"
              title="คืนค่าเกณฑ์เริ่มต้นตามประกาศ สคร.1 เชียงใหม่"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>คืนค่าเกณฑ์เริ่มต้น</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อโรค, ภาษาอังกฤษ, หรือกลุ่มโรค..."
              className="w-full pl-10 pr-3.5 py-2.5 text-[15px] rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-[15px] rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">ทุกกลุ่มโรค ({diseases.length} โรค)</option>
              {DISEASE_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Disease List Table for Admin */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between text-[14px] text-slate-600 font-medium gap-2">
          <span className="font-bold text-slate-800">แสดง {filteredDiseases.length} รายการ (เรียงตามลำดับข้อ)</span>
          <span className="text-[13px] text-slate-500">
            💡 คลิกปุ่ม ▲ / ▼ หรือเปลี่ยนตัวเลขลำดับเพื่อจัดลำดับข้อใหม่ได้ทันที
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredDiseases.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-[15px]">
              ไม่พบรายการโรคตามเงื่อนไขการค้นหา
            </div>
          ) : (
            filteredDiseases.map((disease) => {
              const hasChange = disease.levels.some((l) => l.status === 'ปรับเปลี่ยน');

              return (
                <div
                  key={disease.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1">
                    {/* Sequence Order Controls: Up / Down and Badge */}
                    <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(disease.id, 'up')}
                        disabled={disease.no <= 1}
                        className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                        title="เลื่อนขึ้น 1 ลำดับ"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <div
                        className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[15px] flex items-center justify-center border-2 border-blue-300 shadow-2xs"
                        title={`ลำดับที่ ${disease.no}`}
                      >
                        {disease.no}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMoveOrder(disease.id, 'down')}
                        disabled={disease.no >= diseases.length}
                        className="p-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                        title="เลื่อนลง 1 ลำดับ"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Disease Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-950 text-[17px] leading-snug">
                          {disease.name}
                        </h3>
                        {disease.nameEn && (
                          <span className="text-[14px] text-slate-500">({disease.nameEn})</span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[13px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {disease.groupName}
                        </span>
                        {hasChange ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            มีการปรับเปลี่ยน
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            เกณฑ์คงเดิม
                          </span>
                        )}
                      </div>

                      <div className="text-[14px] text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          จำนวนระดับ:{' '}
                          <strong className="text-slate-800">{disease.levels.length} ระดับ</strong> (
                          {disease.levels.map((l) => l.level).join(', ')})
                        </span>
                        <span className="text-rose-700 font-semibold">
                          เกณฑ์ SAT: ครบทั้ง 3 ระดับ (สคร.1 / SMEs / DCIR)
                        </span>

                        {/* Quick sequence select dropdown */}
                        <div className="inline-flex items-center gap-1.5 text-[13px] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <span className="text-slate-500">ย้ายไปลำดับ:</span>
                          <select
                            value={disease.no}
                            onChange={(e) => handleQuickChangeOrder(disease.id, e.target.value)}
                            className="bg-white border border-slate-300 rounded px-1.5 py-0.2 text-[13px] font-bold text-blue-900 cursor-pointer"
                          >
                            {Array.from({ length: diseases.length }, (_, i) => i + 1).map((num) => (
                              <option key={num} value={num}>
                                ที่ {num}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                    <button
                      onClick={() => setPreviewSatDisease(disease)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[14px] font-bold border border-rose-200 transition-colors cursor-pointer"
                      title="ดูเกณฑ์ SAT ครบทั้ง 3 ระดับ"
                    >
                      <Search className="w-4 h-4 text-rose-600" />
                      <span>ดูเกณฑ์ SAT (3 ระดับ)</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(disease)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[14px] font-bold border border-blue-200 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>แก้ไขเกณฑ์</span>
                    </button>

                    <button
                      onClick={() => handleRequestDelete(disease.id, disease.name)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[14px] font-bold border border-red-200 transition-colors cursor-pointer active:scale-95"
                      title="ลบรายการโรคนี้"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* In-App Delete Confirmation Modal */}
      {diseaseToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการลบรายการโรค / เหตุการณ์
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                ท่านต้องการลบ <strong className="text-red-600 font-bold">"{diseaseToDelete.name}"</strong> ออกจากฐานข้อมูลใช่หรือไม่?
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                การดำเนินการนี้จะลบเกณฑ์เงื่อนไขในทุกระดับของโรคนี้ออกจากระบบถาวร
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDiseaseToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                ยืนยันลบรายการ (ลบถาวร)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Reset Default Confirmation Modal */}
      {isConfirmingReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                ยืนยันการคืนค่าเกณฑ์เริ่มต้น
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                การแก้ไขรายการโรคและเกณฑ์เงื่อนไขทั้งหมดจะถูกรีเซ็ตกลับเป็นค่ามาตรฐาน สคร.1 เชียงใหม่
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingReset(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                ยืนยันคืนค่าเริ่มต้น
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Disease Modal - Matches image 2026-10-05_20-57-01.png 100%! */}
      {editingDisease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#122344] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-base font-bold">
                  {isCreatingNew ? 'เพิ่มรายการโรค / เหตุการณ์ใหม่' : `แก้ไขเกณฑ์: ${editingDisease.name}`}
                </h2>
                <p className="text-xs text-slate-300">
                  กำหนดข้อมูลโรค และเกณฑ์เปรียบเทียบในแต่ละระดับ
                </p>
              </div>
              <button
                onClick={() => setEditingDisease(null)}
                className="text-slate-300 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {levelError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{levelError}</span>
                </div>
              )}

              {/* General Disease Info */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="text-[16px] font-bold text-slate-800 flex items-center gap-1.5">
                  <FolderPlus className="w-5 h-5 text-blue-600" />
                  <span>ข้อมูลทั่วไปของโรค / เหตุการณ์</span>
                </div>

                {/* ลำดับรายการที่ (Order Selector & Editor) - Matches user requirement 3! */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/70 rounded-xl border-2 border-blue-200/90 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-md bg-blue-600 text-white flex items-center justify-center">
                        <ListOrdered className="w-4 h-4" />
                      </span>
                      <span className="text-[17px] font-bold text-blue-950">
                        ลำดับรายการที่ (No.)
                      </span>
                      <span className="text-[14px] bg-blue-200/80 text-blue-900 px-2.5 py-0.5 rounded-full font-extrabold">
                        ตำแหน่ง: ลำดับที่ {editingDisease.no || 1}
                      </span>
                    </div>

                    <label className="flex items-center gap-2 text-[14px] font-medium text-slate-700 cursor-pointer bg-white/90 px-3 py-1 rounded-lg border border-blue-200 hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={autoShiftOrder}
                        onChange={(e) => setAutoShiftOrder(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span>จัดลำดับใหม่อัตโนมัติ (แทรกและรันเลข 1..N ต่อให้อัตโนมัติ ไม่ให้มีเลขซ้ำ)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                    {/* Method 1: เลือกจาก dropdown */}
                    <div className="md:col-span-8">
                      <label className="block text-[14px] font-bold text-slate-800 mb-1">
                        🔹 วิธีที่ 1: เลือกตำแหน่งลำดับจากรายการ (เลือกเพื่อย้ายหรือแทรก)
                      </label>
                      <select
                        value={editingDisease.no || 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setEditingDisease({ ...editingDisease, no: val });
                          }
                        }}
                        className="w-full px-3 py-2 text-[16px] font-bold text-slate-900 rounded-lg border border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer shadow-2xs"
                      >
                        {/* If creating new, show append option at top */}
                        {isCreatingNew && (
                          <option value={diseases.length + 1}>
                            📌 ลำดับที่ {diseases.length + 1} (ต่อท้ายสุดของรายการทั้งหมด)
                          </option>
                        )}
                        {diseases.map((d, idx) => {
                          const posNum = idx + 1;
                          const isThisItem = !isCreatingNew && editingDisease.id === d.id;
                          return (
                            <option key={d.id} value={posNum}>
                              ลำดับที่ {posNum} {isThisItem ? '⭐ [ตำแหน่งปัจจุบัน]' : `(แทรกก่อนหน้า: ${d.name})`}
                            </option>
                          );
                        })}
                        {!isCreatingNew && (
                          <option value={diseases.length}>
                            📌 ลำดับที่ {diseases.length} (ต่อท้ายสุด)
                          </option>
                        )}
                      </select>
                    </div>

                    {/* Method 2: พิมพ์ตัวเลขลำดับเอง */}
                    <div className="md:col-span-4">
                      <label className="block text-[14px] font-bold text-slate-800 mb-1">
                        ✏️ วิธีที่ 2: หรือพิมพ์แก้ไขตัวเลขเอง
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-slate-700 whitespace-nowrap">ลำดับที่</span>
                        <input
                          type="number"
                          min={1}
                          value={editingDisease.no || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setEditingDisease({
                              ...editingDisease,
                              no: isNaN(val) ? 1 : Math.max(1, val),
                            });
                          }}
                          placeholder="ระบุตัวเลข"
                          className="w-full px-3 py-1.5 text-[17px] font-black text-blue-900 rounded-lg border-2 border-blue-400 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-center shadow-2xs"
                        />
                        <span className="text-[14px] text-slate-500 whitespace-nowrap font-medium">
                          / {isCreatingNew ? diseases.length + 1 : diseases.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                  <div className="md:col-span-5">
                    <label className="block text-[15px] font-bold text-slate-800 mb-1">
                      ชื่อโรคภาษาไทย *
                    </label>
                    <input
                      type="text"
                      value={editingDisease.name}
                      onChange={(e) =>
                        setEditingDisease({ ...editingDisease, name: e.target.value })
                      }
                      placeholder="เช่น กาฬโรค, โรคไข้หวัดนก..."
                      className="w-full px-3.5 py-2 text-[16px] rounded-lg border border-slate-300 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[15px] font-bold text-slate-800 mb-1">
                      ชื่อภาษาอังกฤษ
                    </label>
                    <input
                      type="text"
                      value={editingDisease.nameEn || ''}
                      onChange={(e) =>
                        setEditingDisease({ ...editingDisease, nameEn: e.target.value })
                      }
                      placeholder="เช่น Plague, Avian Flu..."
                      className="w-full px-3.5 py-2 text-[16px] rounded-lg border border-slate-300 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[15px] font-bold text-slate-800 mb-1">
                      กลุ่มโรค *
                    </label>
                    <select
                      value={editingDisease.groupId}
                      onChange={(e) => {
                        const grp = DISEASE_GROUPS.find((g) => g.id === e.target.value);
                        setEditingDisease({
                          ...editingDisease,
                          groupId: e.target.value,
                          groupName: grp ? grp.name : editingDisease.groupName,
                        });
                      }}
                      className="w-full px-3 py-1.5 text-[16px] rounded-lg border border-slate-300 bg-white outline-none focus:border-blue-500"
                    >
                      {DISEASE_GROUPS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SAT 3 Levels Editing - Matches user request */}
                <div className="pt-3 border-t border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                      <Search className="w-4 h-4 text-rose-600" />
                      <span>เกณฑ์ตรวจสอบข่าวของ SAT ทั้ง 3 ระดับ (สามารถแก้ไขและเพิ่มได้)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">สคร.1 • SMEs • DCIR</span>
                  </div>

                  {/* Level 1: ODPC 1 */}
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        ระดับที่ 1
                      </span>
                      <label className="text-xs font-bold text-blue-950">
                        เกณฑ์ตรวจสอบข่าว สคร.1 เชียงใหม่ *
                      </label>
                    </div>
                    <p className="text-[11px] text-blue-700 mb-2 font-medium">
                      (เฝ้าระวังเหตุการณ์ผิดปกติในเขตสุขภาพที่ 1 ภาคเหนือตอนบน 8 จังหวัด: เชียงใหม่ ลำพูน ลำปาง แพร่ น่าน พะเยา เชียงราย แม่ฮ่องสอน)
                    </p>
                    <textarea
                      rows={2}
                      value={editingDisease.sat.level1_odpc1}
                      onChange={(e) =>
                        setEditingDisease({
                          ...editingDisease,
                          sat: {
                            ...editingDisease.sat,
                            level1_odpc1: e.target.value,
                          },
                        })
                      }
                      placeholder="ระบุเกณฑ์ตรวจสอบข่าว สคร.1 เชียงใหม่ 8 จังหวัดภาคเหนือตอนบน..."
                      className="w-full p-2.5 text-xs rounded-lg border border-blue-300 bg-white focus:ring-2 focus:ring-blue-100 outline-none leading-relaxed"
                    ></textarea>
                  </div>

                  {/* Level 2: SMEs */}
                  <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        ระดับที่ 2
                      </span>
                      <label className="text-xs font-bold text-purple-950">
                        เกณฑ์สำหรับ SMEs (Subject Matter Experts / ทีมผู้เชี่ยวชาญ) *
                      </label>
                    </div>
                    <p className="text-[11px] text-purple-700 mb-2 font-medium">
                      (ทีมผู้เชี่ยวชาญเฉพาะทางร่วมประเมินและให้คำแนะนำ)
                    </p>
                    <textarea
                      rows={2}
                      value={editingDisease.sat.level2_smes}
                      onChange={(e) =>
                        setEditingDisease({
                          ...editingDisease,
                          sat: {
                            ...editingDisease.sat,
                            level2_smes: e.target.value,
                          },
                        })
                      }
                      placeholder="ระบุเกณฑ์สำหรับทีมผู้เชี่ยวชาญเฉพาะทาง SMEs..."
                      className="w-full p-2.5 text-xs rounded-lg border border-purple-300 bg-white focus:ring-2 focus:ring-purple-100 outline-none leading-relaxed"
                    ></textarea>
                  </div>

                  {/* Level 3: DCIR */}
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        ระดับที่ 3
                      </span>
                      <label className="text-xs font-bold text-emerald-950">
                        เกณฑ์ DCIR (กองระบาดวิทยา กรมควบคุมโรค) *
                      </label>
                    </div>
                    <p className="text-[11px] text-emerald-700 mb-2 font-medium">
                      (กองระบาดวิทยา กรมควบคุมโรค ตรวจสอบและประเมินสถานการณ์ระดับประเทศ)
                    </p>
                    <textarea
                      rows={2}
                      value={editingDisease.sat.level3_dcir}
                      onChange={(e) =>
                        setEditingDisease({
                          ...editingDisease,
                          sat: {
                            ...editingDisease.sat,
                            level3_dcir: e.target.value,
                          },
                        })
                      }
                      placeholder="ระบุเกณฑ์ DCIR กองระบาดวิทยา กรมควบคุมโรค..."
                      className="w-full p-2.5 text-xs rounded-lg border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-100 outline-none leading-relaxed"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Exact Levels Form matching image 2026-10-05_20-57-01.png 100%! */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    เกณฑ์เงื่อนไขในแต่ละระดับ (อำเภอ, จังหวัด, เขต, ส่วนกลาง)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddLevel}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 border border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มระดับ</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {editingDisease.levels.map((lvl) => (
                    <div
                      key={lvl.id}
                      className="p-4 rounded-xl border border-slate-300 bg-white shadow-2xs hover:border-slate-400 transition-all"
                    >
                      {/* Top row of card: Level Dropdown, Status Dropdown, Delete Icon */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          {/* Level Name Dropdown */}
                          <select
                            value={lvl.level}
                            onChange={(e) => handleLevelChange(lvl.id, 'level', e.target.value)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 min-w-[140px]"
                          >
                            {STANDARD_LEVEL_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>

                          {/* Status Dropdown */}
                          <select
                            value={lvl.status}
                            onChange={(e) =>
                              handleLevelChange(lvl.id, 'status', e.target.value as CriteriaStatus)
                            }
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border outline-none min-w-[130px] ${
                              lvl.status === 'ปรับเปลี่ยน'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            <option value="คงเดิม">สถานะ: คงเดิม</option>
                            <option value="ปรับเปลี่ยน">สถานะ: ปรับเปลี่ยน</option>
                          </select>
                        </div>

                        {/* Red Delete Icon button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveLevel(lvl.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="ลบระดับนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Textareas row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            เกณฑ์เดิม สคร.1 (ธ.ค. 2568)
                          </label>
                          <textarea
                            rows={3}
                            value={lvl.originalCriteria}
                            onChange={(e) =>
                              handleLevelChange(lvl.id, 'originalCriteria', e.target.value)
                            }
                            placeholder="ระบุเกณฑ์เดิม..."
                            className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                          ></textarea>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            เกณฑ์ใหม่ กองระบาดวิทยา (ก.ย. 2569)
                          </label>
                          <textarea
                            rows={3}
                            value={lvl.newCriteria}
                            onChange={(e) =>
                              handleLevelChange(lvl.id, 'newCriteria', e.target.value)
                            }
                            placeholder="ระบุเกณฑ์ใหม่..."
                            className={`w-full p-2.5 text-xs rounded-lg border outline-none resize-y ${
                              lvl.status === 'ปรับเปลี่ยน'
                                ? 'border-red-300 text-red-600 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                : 'border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer with [ยกเลิก] and [บันทึกข้อมูล] and [ลบรายการโรคนี้] */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
              {!isCreatingNew && (
                <button
                  type="button"
                  onClick={() => handleRequestDelete(editingDisease.id, editingDisease.name)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer active:scale-95"
                  title="ลบรายการโรคนี้ออกจากฐานข้อมูล"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>ลบรายการโรคนี้</span>
                </button>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setEditingDisease(null)}
                  className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview SAT 3-Level Modal */}
      {previewSatDisease && (
        <SATModal
          disease={previewSatDisease}
          onClose={() => setPreviewSatDisease(null)}
        />
      )}
    </div>
  );
};
