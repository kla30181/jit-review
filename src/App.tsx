/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { RespondentInfoCard } from './components/RespondentInfoCard';
import { FilterBar } from './components/FilterBar';
import { CriteriaTable } from './components/CriteriaTable';
import { SATModal } from './components/SATModal';
import { AdminManager } from './components/AdminManager';
import { SummaryView } from './components/SummaryView';
import { ReferenceDocModal } from './components/ReferenceDocModal';
import {
  DiseaseItem,
  RespondentInfo,
  LevelFeedback,
  FeedbackChoice,
  SubmissionRecord,
} from './types';
import { DISEASE_GROUPS, INITIAL_DISEASE_ITEMS } from './data/defaultCriteria';
import {
  loadDiseaseCriteria,
  saveDiseaseCriteria,
  resetDiseaseCriteriaToDefault,
  loadSubmissions,
  saveSubmission,
  loadDraftFeedback,
  saveDraftFeedback,
  loadDraftRespondent,
  saveDraftRespondent,
} from './services/storageService';
import {
  subscribeToCriteria,
  saveCriteriaToCloud,
  fetchCriteriaFromCloud,
  subscribeToSubmissions,
  saveSubmissionToCloud,
  testFirestoreConnection,
} from './services/firestoreService';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth';
import {
  appendResponsesToSheet,
  getSavedSheetId,
} from './services/googleSheets';
import { CheckCircle, AlertCircle, FileSpreadsheet, ExternalLink, ArrowRight } from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'survey' | 'admin' | 'summary'>('survey');

  // Core Data
  const [diseases, setDiseases] = useState<DiseaseItem[]>(() => loadDiseaseCriteria());
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(() => loadSubmissions());

  // Filter State
  const [selectedGroupId, setSelectedGroupId] = useState<string | 'all'>('all');
  const [onlyChanged, setOnlyChanged] = useState<boolean>(false);

  // Form State
  const [respondent, setRespondent] = useState<RespondentInfo>(() => loadDraftRespondent());
  const [feedback, setFeedback] = useState<Record<string, LevelFeedback>>(() => loadDraftFeedback());

  // Modals
  const [satModalDisease, setSatModalDisease] = useState<DiseaseItem | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [successModalData, setSuccessModalData] = useState<{
    submissionId: string;
    answeredCount: number;
    sheetUrl?: string;
  } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Auth & Google Sheets
  const [user, setUser] = useState<User | null>(null);
  const [activeSheetUrl, setActiveSheetUrl] = useState<string | null>(() => {
    const sheetId = getSavedSheetId();
    return sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null;
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'local'>('syncing');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth Initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync across all devices (PC ↔ Notebook)
  useEffect(() => {
    testFirestoreConnection();

    // Subscribe to criteria updates in real time
    const unsubCriteria = subscribeToCriteria((items, source) => {
      setDiseases(items);
      setCloudSyncStatus(source === 'cloud' ? 'synced' : 'local');
      setLastCloudSyncTime(new Date().toLocaleTimeString('th-TH'));
    });

    // Subscribe to submissions in real time
    const unsubSubmissions = subscribeToSubmissions((subs) => {
      setSubmissions(subs);
    });

    return () => {
      unsubCriteria();
      unsubSubmissions();
    };
  }, []);

  // Save respondent draft
  const handleRespondentChange = (field: keyof RespondentInfo, value: string) => {
    const updated = { ...respondent, [field]: value };
    setRespondent(updated);
    saveDraftRespondent(updated);
    setLastSavedTime(`บันทึกล่าสุด: ${new Date().toLocaleTimeString('th-TH')}`);
  };

  // Save feedback choices
  const handleSelectChoice = (diseaseId: string, levelId: string, choice: FeedbackChoice) => {
    const key = `${diseaseId}_${levelId}`;
    const prev = feedback[key] || { choice };
    const updated = {
      ...feedback,
      [key]: {
        ...prev,
        choice,
      },
    };
    setFeedback(updated);
    saveDraftFeedback(updated);
    setLastSavedTime(`บันทึกล่าสุด: ${new Date().toLocaleTimeString('th-TH')}`);
  };

  // Save hybrid comment
  const handleCommentChange = (diseaseId: string, levelId: string, comment: string) => {
    const key = `${diseaseId}_${levelId}`;
    const prev = feedback[key] || { choice: 'hybrid' as FeedbackChoice };
    const updated = {
      ...feedback,
      [key]: {
        ...prev,
        comment,
      },
    };
    setFeedback(updated);
    saveDraftFeedback(updated);
    setLastSavedTime(`บันทึกล่าสุด: ${new Date().toLocaleTimeString('th-TH')}`);
  };

  // Clear answers if user wants to reset
  const handleClearResponses = () => {
    setFeedback({});
    saveDraftFeedback({});
    showToast('ล้างคำตอบเพื่อเริ่มทำใหม่เรียบร้อยแล้ว');
  };

  // Calculate changed diseases count per group and overall
  const changedDiseasesCount = useMemo(() => {
    return diseases.filter((d) => d.levels.some((l) => l.status === 'ปรับเปลี่ยน')).length;
  }, [diseases]);

  const groupChangedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DISEASE_GROUPS.forEach((g) => {
      counts[g.id] = diseases.filter(
        (d) => d.groupId === g.id && d.levels.some((l) => l.status === 'ปรับเปลี่ยน')
      ).length;
    });
    return counts;
  }, [diseases]);

  // Filtered diseases for display - synchronized across groups and onlyChanged
  const displayedDiseases = useMemo(() => {
    return diseases.filter((d) => {
      if (selectedGroupId !== 'all' && d.groupId !== selectedGroupId) {
        return false;
      }
      if (onlyChanged) {
        const hasChange = d.levels.some((l) => l.status === 'ปรับเปลี่ยน');
        if (!hasChange) return false;
      }
      return true;
    });
  }, [diseases, onlyChanged, selectedGroupId]);

  // Dynamic question progress based on active view and onlyChanged filter
  const { totalLevelsCount, answeredLevelsCount, filterContextLabel } = useMemo(() => {
    let total = 0;
    let answered = 0;

    displayedDiseases.forEach((d) => {
      d.levels.forEach((l) => {
        if (onlyChanged) {
          if (l.status === 'ปรับเปลี่ยน') {
            total++;
            const key = `${d.id}_${l.id}`;
            if (feedback[key]?.choice) {
              answered++;
            }
          }
        } else {
          total++;
          const key = `${d.id}_${l.id}`;
          if (feedback[key]?.choice) {
            answered++;
          }
        }
      });
    });

    let contextLabel: string | undefined = undefined;
    if (selectedGroupId !== 'all') {
      const activeGroup = DISEASE_GROUPS.find((g) => g.id === selectedGroupId);
      if (activeGroup) {
        contextLabel = activeGroup.name;
      }
    }

    return {
      totalLevelsCount: total,
      answeredLevelsCount: answered,
      filterContextLabel: contextLabel,
    };
  }, [displayedDiseases, feedback, onlyChanged, selectedGroupId]);

  // Google Login
  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        showToast(`เข้าสู่ระบบในชื่อ ${result.user.displayName || result.user.email} สำเร็จ`);
      }
    } catch (err: any) {
      showToast(`การเข้าสู่ระบบไม่สำเร็จ: ${err.message || 'โปรดลองใหม่อีกครั้ง'}`);
    }
  };

  // Google Logout
  const handleLogout = async () => {
    await logout();
    setUser(null);
    showToast('ออกจากระบบเรียบร้อย');
  };

  // Submit survey responses
  const handleSubmitSurvey = async () => {
    if (!respondent.fullName.trim()) {
      showToast('กรุณากรอก "ชื่อ-นามสกุล" ของท่านก่อนส่งแบบสอบถาม');
      return;
    }
    if (!respondent.positionOrg.trim()) {
      showToast('กรุณากรอก "ตำแหน่ง / กลุ่มงาน / หน่วยงาน" ของท่านก่อนส่งแบบสอบถาม');
      return;
    }
    if (answeredLevelsCount === 0) {
      showToast('กรุณาเลือกความคิดเห็นอย่างน้อย 1 ข้อ');
      return;
    }

    setIsSubmitting(true);

    try {
      const newSubmission: SubmissionRecord = {
        id: `sub-${Date.now()}`,
        respondent: {
          fullName: respondent.fullName.trim(),
          positionOrg: respondent.positionOrg.trim(),
          email: user?.email || undefined,
        },
        responses: { ...feedback },
        createdAt: new Date().toISOString(),
      };

      // Save locally and to Cloud Firestore (cross-device persistence)
      saveSubmission(newSubmission);
      await saveSubmissionToCloud(newSubmission);
      const updatedSubmissions = loadSubmissions();
      setSubmissions(updatedSubmissions);

      let sheetUrl: string | undefined = undefined;

      // If user is connected to Google Sheets, sync immediately
      const token = await getAccessToken();
      if (user) {
        try {
          const syncRes = await appendResponsesToSheet(token, newSubmission, diseases);
          if (syncRes.success) {
            sheetUrl = syncRes.spreadsheetUrl;
            setActiveSheetUrl(sheetUrl);
          }
        } catch (syncErr: any) {
          console.error('Google Sheets sync error:', syncErr);
        }
      }

      setSuccessModalData({
        submissionId: newSubmission.id,
        answeredCount: answeredLevelsCount,
        sheetUrl,
      });

      // Preserve responses so user answers do not disappear when submitted or refreshed!
      saveDraftFeedback(feedback);
      setLastSavedTime(`บันทึกและส่งข้อมูลสำเร็จ: ${new Date().toLocaleTimeString('th-TH')}`);
      showToast('บันทึกข้อมูลความคิดเห็นเรียบร้อยแล้ว (ข้อมูลถูกจัดเก็บถาวร)');
    } catch (err: any) {
      showToast(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Immediate connect & open Google Sheet
  const handleConnectAndOpenSheet = async (subId?: string) => {
    try {
      setIsSyncingSheets(true);
      let token = await getAccessToken();
      if (!token) {
        const signinRes = await googleSignIn();
        if (!signinRes) {
          setIsSyncingSheets(false);
          return;
        }
        token = signinRes.accessToken;
        setUser(signinRes.user);
      }

      let currentSubs = loadSubmissions();
      let targetSub = subId ? currentSubs.find((s) => s.id === subId) : currentSubs[0];

      // If active feedback exists, bundle and save to submission immediately
      if (Object.keys(feedback).length > 0) {
        const activeSub: SubmissionRecord = {
          id: `sub-${Date.now()}`,
          respondent: {
            fullName: respondent.fullName.trim() || 'สมาชิกทีม JIT สคร.1',
            positionOrg: respondent.positionOrg.trim() || '-',
            email: user?.email || undefined,
          },
          responses: { ...feedback },
          createdAt: new Date().toISOString(),
        };
        saveSubmission(activeSub);
        await saveSubmissionToCloud(activeSub);
        targetSub = activeSub;
        setSubmissions(loadSubmissions());
      }

      if (targetSub) {
        const res = await appendResponsesToSheet(token, targetSub, diseases);
        if (res.success && res.spreadsheetUrl) {
          setActiveSheetUrl(res.spreadsheetUrl);
          if (successModalData) {
            setSuccessModalData({
              ...successModalData,
              sheetUrl: res.spreadsheetUrl,
            });
          }
          window.open(res.spreadsheetUrl, '_blank');
          showToast('บันทึกข้อมูลและเปิด Google Sheet เรียบร้อยแล้ว');
        }
      } else if (activeSheetUrl) {
        window.open(activeSheetUrl, '_blank');
      } else {
        // Create an initial sheet and link
        const res = await appendResponsesToSheet(
          token,
          {
            id: `sub-init`,
            respondent: { fullName: respondent.fullName || 'สมาชิก JIT สคร.1', positionOrg: respondent.positionOrg || '-' },
            responses: {},
            createdAt: new Date().toISOString(),
          },
          diseases
        );
        if (res.spreadsheetUrl) {
          setActiveSheetUrl(res.spreadsheetUrl);
          window.open(res.spreadsheetUrl, '_blank');
          showToast('สร้างและเปิด Google Sheet สำเร็จเรียบร้อย');
        }
      }
    } catch (err: any) {
      showToast(`เชื่อมต่อ Google Sheets ไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Manual sync to Google Sheets from Summary page or Header
  const handleSyncGoogleSheets = async () => {
    if (submissions.length === 0) {
      showToast('ยังไม่มีข้อมูลการตอบแบบสอบถามในระบบ');
      return;
    }

    let token = await getAccessToken();
    if (!token) {
      try {
        const signinRes = await googleSignIn();
        if (!signinRes) return;
        token = signinRes.accessToken;
        setUser(signinRes.user);
      } catch (err: any) {
        showToast(`เข้าสู่ระบบไม่สำเร็จ: ${err.message}`);
        return;
      }
    }

    setIsSyncingSheets(true);
    try {
      let latestSheetUrl = '';
      for (const sub of submissions) {
        const res = await appendResponsesToSheet(token, sub, diseases);
        latestSheetUrl = res.spreadsheetUrl;
      }
      setActiveSheetUrl(latestSheetUrl);
      showToast('ส่งข้อมูลทั้งหมดไปยัง Google Sheets สำเร็จเรียบร้อย');
    } catch (err: any) {
      showToast(`ไม่สามารถบันทึกลง Google Sheets: ${err.message}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Admin save changes (Cloud Firestore + Local)
  const handleSaveDiseases = async (updated: DiseaseItem[]) => {
    setDiseases(updated);
    setCloudSyncStatus('syncing');
    const success = await saveCriteriaToCloud(updated);
    if (success) {
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date().toLocaleTimeString('th-TH'));
      showToast('☁️ บันทึกขึ้นคลาวด์แล้ว ทุกเครื่อง (PC/โน๊ตบุค) จะอัปเดตตรงกันทันที');
    } else {
      setCloudSyncStatus('local');
      showToast('⚠️ บันทึกในเครื่องเรียบร้อย (เชื่อมต่อคลาวด์ไม่ได้ชั่วคราว)');
    }
  };

  // Admin reset
  const handleResetDefault = async () => {
    setDiseases(INITIAL_DISEASE_ITEMS);
    setCloudSyncStatus('syncing');
    const success = await saveCriteriaToCloud(INITIAL_DISEASE_ITEMS);
    if (success) {
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date().toLocaleTimeString('th-TH'));
      showToast('คืนค่าเกณฑ์เริ่มต้นและอัปเดตขึ้นระบบคลาวด์เรียบร้อย');
    }
  };

  // Manual cloud actions
  const handleManualSyncToCloud = async () => {
    setCloudSyncStatus('syncing');
    const success = await saveCriteriaToCloud(diseases);
    if (success) {
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date().toLocaleTimeString('th-TH'));
      showToast(`☁️ บันทึกข้อมูลขึ้นคลาวด์สำเร็จ (${diseases.length} รายการ)`);
    } else {
      setCloudSyncStatus('local');
      showToast('ไม่สามารถเชื่อมต่อคลาวด์ได้ในขณะนี้');
    }
  };

  const handleForcePullFromCloud = async () => {
    setCloudSyncStatus('syncing');
    const items = await fetchCriteriaFromCloud();
    if (items && items.length > 0) {
      setDiseases(items);
      setCloudSyncStatus('synced');
      setLastCloudSyncTime(new Date().toLocaleTimeString('th-TH'));
      showToast(`☁️ ดึงข้อมูลล่าสุดจากคลาวด์สำเร็จ (${items.length} รายการ)`);
    } else {
      setCloudSyncStatus('synced');
      showToast('ข้อมูลบนเครื่องตรงกับคลาวด์แล้ว');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#122344] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium border border-blue-400/40 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDocModal={() => setIsDocModalOpen(true)}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeSheetUrl={activeSheetUrl}
        cloudSyncStatus={cloudSyncStatus}
        lastCloudSyncTime={lastCloudSyncTime}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-2.5 sm:px-4 lg:px-6 py-4">
        {activeTab === 'survey' && (
          <div>
            {/* Respondent Info Card with Progress Bar and Auto-Save Status */}
            <RespondentInfoCard
              respondent={respondent}
              onChange={handleRespondentChange}
              answeredCount={answeredLevelsCount}
              totalCount={totalLevelsCount}
              isFilteringChanged={onlyChanged}
              filterContextLabel={filterContextLabel}
              lastSavedTime={lastSavedTime}
              onConnectAndOpenSheet={() => handleConnectAndOpenSheet()}
              activeSheetUrl={activeSheetUrl}
            />

            {/* Active Google Sheet banner if available */}
            {activeSheetUrl && (
              <div className="mb-4 px-4 py-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>Google Sheet บันทึกผลลัพธ์:</strong> ข้อมูลการแสดงความคิดเห็นเชื่อมโยงกับ Google Sheet เรียบร้อย
                  </span>
                </div>
                <a
                  href={activeSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors shadow-2xs"
                >
                  <span>เปิด Google Sheet ทันที</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Filter Bar with 13 disease groups and "เกณฑ์ที่มีการเปลี่ยนแปลง" button */}
            <FilterBar
              selectedGroupId={selectedGroupId}
              onlyChanged={onlyChanged}
              onSelectGroup={(gid) => setSelectedGroupId(gid)}
              onToggleChanged={() => setOnlyChanged(!onlyChanged)}
              changedCount={changedDiseasesCount}
              groupChangedCounts={groupChangedCounts}
            />

            {/* Comparison Criteria Table */}
            <CriteriaTable
              diseases={displayedDiseases}
              feedback={feedback}
              onSelectChoice={handleSelectChoice}
              onCommentChange={handleCommentChange}
              onOpenSATModal={(d) => setSatModalDisease(d)}
              onSubmit={handleSubmitSurvey}
              isSubmitting={isSubmitting}
              onConnectAndOpenSheet={() => handleConnectAndOpenSheet()}
              activeSheetUrl={activeSheetUrl}
              lastSavedTime={lastSavedTime}
              onClearResponses={handleClearResponses}
            />
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminManager
            diseases={diseases}
            onSaveDiseases={handleSaveDiseases}
            onResetDefault={handleResetDefault}
            cloudSyncStatus={cloudSyncStatus}
            lastCloudSyncTime={lastCloudSyncTime}
            onManualSyncToCloud={handleManualSyncToCloud}
            onForcePullFromCloud={handleForcePullFromCloud}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryView
            diseases={diseases}
            submissions={submissions}
            user={user}
            onSyncGoogleSheets={handleSyncGoogleSheets}
            activeSheetUrl={activeSheetUrl}
            isSyncingSheets={isSyncingSheets}
          />
        )}
      </main>

      {/* SAT 3-Level Modal Popup */}
      <SATModal disease={satModalDisease} onClose={() => setSatModalDisease(null)} />

      {/* Official Doc 2568 Reference Modal */}
      <ReferenceDocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />

      {/* Submission Success Dialog */}
      {successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-slate-200 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                บันทึกความคิดเห็นสำเร็จเรียบร้อย!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                ขอบคุณสำหรับการร่วมทบทวนเกณฑ์การออกสอบสวนโรค JIT สคร.1 เชียงใหม่
                (บันทึกแล้ว {successModalData.answeredCount} ข้อ)
              </p>
            </div>

            {successModalData.sheetUrl ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-left text-xs text-emerald-900">
                <div className="font-semibold flex items-center gap-1.5 mb-1 text-emerald-800">
                  <FileSpreadsheet className="w-4 h-4" />
                  บันทึกลง Google Sheets เรียบร้อยแล้ว
                </div>
                <a
                  href={successModalData.sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 underline font-bold hover:text-emerald-900 mt-1"
                >
                  คลิกเพื่อเปิดดู Google Sheet <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-left text-xs text-blue-900">
                <span>
                  ข้อมูลถูกบันทึกในระบบเรียบร้อย หากต้องการส่งข้อมูลต่อไปยัง Google Sheets
                  สามารถกดเชื่อมต่อที่เมนูด้านบนได้ตลอดเวลา
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSuccessModalData(null);
                  setActiveTab('summary');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <span>ดูสรุปผลภาพรวม</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSuccessModalData(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            กลุ่มระบาดวิทยาและตอบโต้ภาวะฉุกเฉินทางสาธารณสุข สำนักงานป้องกันควบคุมโรคที่ 1 เชียงใหม่
          </div>
          <div className="text-[11px] text-slate-400">
            ระบบทบทวนเงื่อนไข JIT ฉบับปรับปรุง ตุลาคม 2569 • รองรับเขตสุขภาพที่ 1 (8 จังหวัดภาคเหนือตอนบน)
          </div>
        </div>
      </footer>
    </div>
  );
}
