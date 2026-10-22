import React, { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  PlusCircle,
  Database,
  Layers,
  Calendar,
  FileCheck,
  ChevronRight,
  Eye,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Sliders,
  Award,
  Upload,
  Archive,
  ArchiveRestore,
  Edit,
  Trash2,
  FileQuestion,
  ToggleLeft,
  ToggleRight,
  Check,
  X,
  FileSpreadsheet,
  Scale,
} from 'lucide-react';
import {
  Applicant,
  PPDBStatistics,
  QuestionBank,
  TestCategory,
  TestSchedule,
  AdmissionDecision,
  TestResult,
  AnnouncementConfig,
  ScoreDistribution,
  CategoryPerformanceStat,
  ProgramStat,
} from '../../../types/ppdb';
import {
  getAllApplicants,
  getPPDBStatistics,
  getComprehensiveSelectionStats,
  getAllTestResults,
  getAnnouncementConfig,
  getTestCategories,
  getTestSchedules,
  getQuestions,
  getAdmissionDecisions,
  submitAdmissionDecision,
  updateApplicant,
  archiveApplicant,
  deleteApplicant,
  deleteTestCategory,
  deleteQuestion,
  deleteTestSchedule,
  updateScheduleStatus,
  saveTestCategory,
  saveQuestion,
  seedPPDBMasterData,
} from '../../../services/ppdbService';
import { StatsCard } from '../../common/StatsCard';
import { EmptyState } from '../../common/EmptyState';
import { ApplicantDetailModal } from '../../modals/ApplicantDetailModal';
import { ApplicantFormModal } from '../../modals/ApplicantFormModal';
import { CsvImportModal } from '../../modals/CsvImportModal';
import { CategoryModal } from '../../modals/CategoryModal';
import { QuestionModal } from '../../modals/QuestionModal';
import { QuestionPreviewModal } from '../../modals/QuestionPreviewModal';
import { ScheduleModal } from '../../modals/ScheduleModal';
import { GradingConfigPanel } from './GradingConfigPanel';
import { ScoreRecapModal } from '../../results/ScoreRecapModal';
import { SelectionResultsDashboard } from './SelectionResultsDashboard';
import { ApplicantResultDetailModal } from '../../modals/ApplicantResultDetailModal';
import { AnnouncementSettingsModal } from './AnnouncementSettingsModal';
import { DecisionAuditHistoryModal } from '../../modals/DecisionAuditHistoryModal';
import { PrintableReportView } from '../../reports/PrintableReportView';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PPDBStatistics>({
    totalApplicants: 0,
    untestedApplicants: 0,
    testedApplicants: 0,
    incompleteAssessmentApplicants: 0,
    pendingDecisionApplicants: 0,
    acceptedApplicants: 0,
    rejectedApplicants: 0,
    waitlistApplicants: 0,
  });

  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformanceStat[]>([]);
  const [programStats, setProgramStats] = useState<ProgramStat[]>([]);
  const [resultsMap, setResultsMap] = useState<Map<string, TestResult>>(new Map());
  const [decisionsMap, setDecisionsMap] = useState<Map<string, AdmissionDecision>>(new Map());
  const [announcementConfig, setAnnouncementConfig] = useState<AnnouncementConfig | null>(null);

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [schedules, setSchedules] = useState<TestSchedule[]>([]);
  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [decisions, setDecisions] = useState<AdmissionDecision[]>([]);

  // Navigation tab - Default to 'results' for Modul 4 focus
  const [activeTab, setActiveTab] = useState<'results' | 'applicants' | 'categories' | 'questions' | 'schedules' | 'grading' | 'decisions'>('results');

  // Filters for Applicants
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [testStatusFilter, setTestStatusFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Filters for Questions
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState<string>('all');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<string>('all');
  const [questionSearch, setQuestionSearch] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);

  // Modals state
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [selectedApplicantForRecap, setSelectedApplicantForRecap] = useState<Applicant | null>(null);
  const [selectedApplicantForResultDetail, setSelectedApplicantForResultDetail] = useState<Applicant | null>(null);
  const [applicantFormTarget, setApplicantFormTarget] = useState<Applicant | null | 'create'>(null);
  const [showCsvImport, setShowCsvImport] = useState<boolean>(false);

  const [categoryFormTarget, setCategoryFormTarget] = useState<TestCategory | null | 'create'>(null);
  const [questionFormTarget, setQuestionFormTarget] = useState<QuestionBank | null | 'create'>(null);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionBank | null>(null);
  const [scheduleFormTarget, setScheduleFormTarget] = useState<TestSchedule | null | 'create'>(null);

  // Modul 4 Modals
  const [showAnnouncementSettings, setShowAnnouncementSettings] = useState<boolean>(false);
  const [showAuditLogs, setShowAuditLogs] = useState<boolean>(false);
  const [printReportMode, setPrintReportMode] = useState<string | null>(null);

  // Decision Modal State
  const [decisionModalApplicant, setDecisionModalApplicant] = useState<Applicant | null>(null);
  const [decisionChoice, setDecisionChoice] = useState<'accepted' | 'waitlist' | 'rejected'>('accepted');
  const [decisionNote, setDecisionNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comprehensive, appData, catData, schedData, qData, decData, allResults, annConfig] = await Promise.all([
        getComprehensiveSelectionStats(),
        getAllApplicants(true),
        getTestCategories(),
        getTestSchedules(),
        getQuestions(),
        getAdmissionDecisions(),
        getAllTestResults(),
        getAnnouncementConfig(),
      ]);

      setStats(comprehensive.stats);
      setScoreDistribution(comprehensive.scoreDistribution);
      setCategoryPerformance(comprehensive.categoryPerformance);
      setProgramStats(comprehensive.programStats);

      setApplicants(appData);
      setCategories(catData);
      setSchedules(schedData);
      setQuestions(qData);
      setDecisions(decData);
      setAnnouncementConfig(annConfig);

      // Map results and decisions by applicantId
      const rMap = new Map<string, TestResult>();
      allResults.forEach((r) => rMap.set(r.applicantId, r));
      setResultsMap(rMap);

      const dMap = new Map<string, AdmissionDecision>();
      decData.forEach((d) => dMap.set(d.applicantId, d));
      setDecisionsMap(dMap);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedData = async () => {
    if (window.confirm('Muat data master 5 kategori tes, bank soal, jadwal dan calon santri Pondok Pesantren Al Ikhlas?')) {
      setSeeding(true);
      await seedPPDBMasterData();
      await loadData();
      setSeeding(false);
    }
  };

  const handleArchiveToggle = async (applicant: Applicant) => {
    const isCurrentlyArchived = applicant.status === 'archived';
    const actionLabel = isCurrentlyArchived ? 'mengaktifkan kembali' : 'mengarsipkan / menonaktifkan';

    if (window.confirm(`Apakah Anda yakin ingin ${actionLabel} calon santri "${applicant.fullName}"?`)) {
      await archiveApplicant(applicant.id, !isCurrentlyArchived);
      await loadData();
    }
  };

  const handleDeleteApplicant = async (applicant: Applicant) => {
    if (window.confirm(`Hapus permanen data calon santri "${applicant.fullName}" (${applicant.registrationNumber})? Tindakan ini tidak dapat dibatalkan.`)) {
      await deleteApplicant(applicant.id);
      await loadData();
    }
  };

  const handleDeleteCategory = async (cat: TestCategory) => {
    if (window.confirm(`Hapus kategori ujian "${cat.name}"?`)) {
      await deleteTestCategory(cat.id);
      await loadData();
    }
  };

  const handleToggleCategoryActive = async (cat: TestCategory) => {
    await saveTestCategory({
      ...cat,
      isActive: !cat.isActive,
    });
    await loadData();
  };

  const handleDeleteQuestion = async (q: QuestionBank) => {
    if (window.confirm('Hapus butir soal ini dari bank soal?')) {
      await deleteQuestion(q.id);
      await loadData();
    }
  };

  const handleToggleQuestionActive = async (q: QuestionBank) => {
    await saveQuestion({
      ...q,
      isActive: !q.isActive,
    });
    await loadData();
  };

  const handleDeleteSchedule = async (s: TestSchedule) => {
    if (window.confirm(`Hapus sesi jadwal "${s.title}"?`)) {
      await deleteTestSchedule(s.id);
      await loadData();
    }
  };

  const handleScheduleStatusChange = async (scheduleId: string, newStatus: 'open' | 'closed' | 'cancelled') => {
    await updateScheduleStatus(scheduleId, newStatus);
    await loadData();
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModalApplicant) return;

    setSubmittingDecision(true);
    try {
      await submitAdmissionDecision({
        applicantId: decisionModalApplicant.id,
        applicantName: decisionModalApplicant.fullName,
        registrationNumber: decisionModalApplicant.registrationNumber,
        decision: decisionChoice,
        notes: decisionNote || `Dinyatakan ${decisionChoice === 'accepted' ? 'Lulus Diterima' : decisionChoice === 'waitlist' ? 'Cadangan' : 'Belum Lulus'} pada seleksi PPDB Pondok Pesantren Al Ikhlas.`,
        decidedBy: 'admin',
      });
      setDecisionModalApplicant(null);
      setDecisionNote('');
      await loadData();
    } catch (err) {
      console.error('Error submitting decision', err);
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Filter Applicants
  const filteredApplicants = applicants.filter((a) => {
    if (!showArchived && a.status === 'archived') return false;
    if (showArchived && a.status !== 'archived') return false;

    const matchesSearch =
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nisn.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

    let matchesTestStatus = true;
    if (testStatusFilter === 'untested') {
      matchesTestStatus = a.status === 'registered' || a.status === 'verified';
    } else if (testStatusFilter === 'testing') {
      matchesTestStatus = a.status === 'testing';
    } else if (testStatusFilter === 'tested') {
      matchesTestStatus = a.status === 'tested' || a.status === 'announced';
    }

    return matchesSearch && matchesStatus && matchesTestStatus;
  });

  // Filter Questions
  const filteredQuestions = questions.filter((q) => {
    const matchesCat = questionCategoryFilter === 'all' || q.categoryId === questionCategoryFilter;
    const matchesType = questionTypeFilter === 'all' || q.questionType === questionTypeFilter;
    const matchesSearch =
      q.questionText.toLowerCase().includes(questionSearch.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(questionSearch.toLowerCase()));

    return matchesCat && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#091a32] via-[#0f2b5c] to-[#1e3a8a] rounded-3xl p-6 text-white shadow-xl border border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Pusat Kendali Panitia PPDB
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold">
            Manajemen Peserta, Bank Soal & Konfigurasi Seleksi
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Pondok Pesantren Al Ikhlas &bull; Kelola data pendaftar, butir bank soal CBT, jadwal ujian, dan pembobotan penilaian kelulusan santri baru secara terintegrasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <button
            type="button"
            onClick={handleSeedData}
            disabled={seeding}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 transition-all shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {seeding ? 'Memuat Data...' : 'Muat Data Master & Demo'}
          </button>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Calon Peserta"
          value={stats.totalApplicants}
          icon={Users}
          description="Santri terdaftar aktif di sistem"
          accentColor="blue"
          badgeText="Semua Gelombang"
        />
        <StatsCard
          title="Peserta Belum Tes"
          value={stats.untestedApplicants}
          icon={Clock}
          description="Menunggu jadwal atau verifikasi"
          accentColor="amber"
          badgeText="Antrean"
        />
        <StatsCard
          title="Peserta Sudah Tes"
          value={stats.testedApplicants}
          icon={CheckCircle2}
          description="Selesai mengikuti seluruh tes"
          accentColor="emerald"
          badgeText="Selesai Ujian"
        />
        <StatsCard
          title="Menunggu Keputusan"
          value={stats.pendingDecisionApplicants}
          icon={AlertTriangle}
          description="Nilai siap diplenokan panitia"
          accentColor="gold"
          badgeText="Pleno"
        />
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto p-2 bg-slate-50/80 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'results'
                ? 'bg-[#0f2b5c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-4 h-4 text-amber-300" />
            Hasil Seleksi & Laporan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applicants')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'applicants'
                ? 'bg-[#0f2b5c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Calon Santri ({applicants.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-[#0f2b5c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            Kategori Tes ({categories.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'questions'
                ? 'bg-[#0f2b5c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            Bank Soal ({questions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedules')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'schedules'
                ? 'bg-[#0f2b5c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Jadwal Tes ({schedules.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grading')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'grading'
                ? 'bg-[#0f2b5c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Konfigurasi Penilaian
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decisions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'decisions'
                ? 'bg-[#0f2b5c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Keputusan Penerimaan ({decisions.length})
          </button>
        </div>

        {/* ================= TAB 0: HASIL SELEKSI & LAPORAN (MODUL 4) ================= */}
        {activeTab === 'results' && (
          <div className="p-5">
            <SelectionResultsDashboard
              stats={stats}
              scoreDistribution={scoreDistribution}
              categoryPerformance={categoryPerformance}
              programStats={programStats}
              applicants={applicants}
              results={resultsMap}
              decisions={decisionsMap}
              categories={categories}
              onOpenApplicantDetail={(app) => setSelectedApplicantForResultDetail(app)}
              onOpenAnnouncementSettings={() => setShowAnnouncementSettings(true)}
              onOpenAuditLogs={() => setShowAuditLogs(true)}
              onOpenPrintReport={(filterMode) => setPrintReportMode(filterMode || 'all')}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* ================= TAB 1: MANAJEMEN CALON SANTRI ================= */}
        {activeTab === 'applicants' && (
          <div className="p-5 space-y-4">
            {/* Action Bar: Search, Filters, Add, CSV Import */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama, NISN, atau no. registrasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-700"
                  >
                    <option value="all">Status: Semua</option>
                    <option value="registered">Terdaftar</option>
                    <option value="verified">Terverifikasi</option>
                    <option value="testing">Sedang Ujian</option>
                    <option value="tested">Selesai Ujian</option>
                    <option value="announced">Diumumkan</option>
                  </select>

                  <select
                    value={testStatusFilter}
                    onChange={(e) => setTestStatusFilter(e.target.value)}
                    className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-700"
                  >
                    <option value="all">Tes: Semua</option>
                    <option value="untested">Belum Tes</option>
                    <option value="testing">Sedang Tes</option>
                    <option value="tested">Sudah Tes</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowArchived(!showArchived)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
                    showArchived
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  {showArchived ? 'Lihat Santri Aktif' : 'Lihat Arsip'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCsvImport(true)}
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  Impor CSV
                </button>

                <button
                  type="button"
                  onClick={() => setApplicantFormTarget('create')}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                  Tambah Santri
                </button>
              </div>
            </div>

            {/* Applicants Table */}
            {filteredApplicants.length === 0 ? (
              <EmptyState
                icon={Users}
                title={showArchived ? 'Tidak Ada Santri yang Diarsipkan' : 'Belum Ada Data Calon Santri'}
                description={
                  applicants.length === 0
                    ? 'Database pendaftaran PPDB masih kosong. Anda dapat menambahkan santri manual, impor CSV, atau memuat data master contoh.'
                    : 'Tidak ada data calon santri yang sesuai kriteria pencarian dan filter.'
                }
                actionText={applicants.length === 0 ? 'Muat Data Contoh PPDB' : undefined}
                onAction={applicants.length === 0 ? handleSeedData : undefined}
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">No. Registrasi</th>
                      <th className="py-3 px-4">Nama Lengkap & Program</th>
                      <th className="py-3 px-4">NISN / Asal Sekolah</th>
                      <th className="py-3 px-4">Wali & No. HP</th>
                      <th className="py-3 px-4">Status Seleksi</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredApplicants.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                          {a.registrationNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{a.fullName}</div>
                          <div className="text-[11px] text-slate-500">{a.program} &bull; {a.wave}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono">{a.nisn} ({a.gender})</div>
                          <div className="text-[11px] text-slate-400">{a.previousSchool}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div>{a.parentName}</div>
                          <div className="text-[11px] text-slate-400">{a.parentPhone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                              a.status === 'announced'
                                ? 'bg-emerald-100 text-emerald-800'
                                : a.status === 'tested'
                                ? 'bg-purple-100 text-purple-800'
                                : a.status === 'testing'
                                ? 'bg-amber-100 text-amber-800'
                                : a.status === 'verified'
                                ? 'bg-blue-100 text-blue-800'
                                : a.status === 'archived'
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {a.status === 'registered' ? 'Terdaftar' :
                             a.status === 'verified' ? 'Terverifikasi' :
                             a.status === 'testing' ? 'Sedang Tes' :
                             a.status === 'tested' ? 'Sudah Tes' :
                             a.status === 'announced' ? 'Diumumkan' : 'Diarsipkan'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => setSelectedApplicantForResultDetail(a)}
                            className="p-1.5 rounded-lg text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100/70"
                            title="Lembar Detail Hasil Seleksi & Pleno"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedApplicantForRecap(a)}
                            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-100/70"
                            title="Rekap Nilai Sederhana"
                          >
                            <Scale className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDecisionModalApplicant(a);
                              setDecisionChoice('accepted');
                              setDecisionNote('');
                            }}
                            className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/70"
                            title="Tetapkan Keputusan Kelulusan Cepat"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedApplicant(a)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0f2b5c] hover:bg-slate-100"
                            title="Lihat Detail Biodata"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setApplicantFormTarget(a)}
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="Edit Data Santri"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchiveToggle(a)}
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                            title={a.status === 'archived' ? 'Pulihkan dari Arsip' : 'Arsipkan Data'}
                          >
                            {a.status === 'archived' ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteApplicant(a)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Hapus Permanen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: KATEGORI TES ================= */}
        {activeTab === 'categories' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Kategori Materi Ujian Seleksi (5 Kategori Pesantren)
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola struktur materi ujian: Tes Akademik, Baca Al-Qur&apos;an, Hafalan Tahfidz, Wawancara, dan Praktik Ibadah.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCategoryFormTarget('create')}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-white flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                Tambah Kategori
              </button>
            </div>

            {categories.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="Kategori Tes Belum Tersedia"
                description="Kategori ujian seleksi belum dikonfigurasi. Klik tombol di bawah untuk memuat kategori standar pesantren."
                actionText="Muat 5 Kategori Standar PPDB"
                onAction={handleSeedData}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      c.isActive !== false
                        ? 'bg-white border-slate-200 shadow-xs hover:border-amber-400'
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {c.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                            Bobot: {c.weight}%
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            KKM: {c.passingGrade}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="capitalize text-slate-600 text-[11px] font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          Tipe: {c.type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {c.isActive !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryActive(c)}
                          className="p-1.5 text-slate-500 hover:text-[#0f2b5c]"
                          title={c.isActive !== false ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori'}
                        >
                          {c.isActive !== false ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryFormTarget(c)}
                          className="p-1.5 text-blue-600 hover:text-blue-800"
                          title="Ubah Kategori"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c)}
                          className="p-1.5 text-red-500 hover:text-red-700"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: BANK SOAL ================= */}
        {activeTab === 'questions' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari butir soal berdasarkan teks pertanyaan..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={questionCategoryFilter}
                    onChange={(e) => setQuestionCategoryFilter(e.target.value)}
                    className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-700"
                  >
                    <option value="all">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.code || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={questionTypeFilter}
                    onChange={(e) => setQuestionTypeFilter(e.target.value)}
                    className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-700"
                  >
                    <option value="all">Semua Tipe Soal</option>
                    <option value="multiple_choice">Pilihan Ganda (PG)</option>
                    <option value="true_false">Benar / Salah</option>
                    <option value="short_answer">Isian Singkat</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setQuestionFormTarget('create')}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-white flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                Tambah Butir Soal
              </button>
            </div>

            {filteredQuestions.length === 0 ? (
              <EmptyState
                icon={FileQuestion}
                title="Bank Soal Masih Kosong"
                description={
                  questions.length === 0
                    ? 'Belum ada butir soal dalam bank soal. Anda dapat menambahkan soal baru atau memuat data contoh tes pesantren.'
                    : 'Tidak ada soal yang cocok dengan filter yang dipilih.'
                }
                actionText={questions.length === 0 ? 'Muat Soal Contoh PPDB' : undefined}
                onAction={questions.length === 0 ? handleSeedData : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQuestions.map((q, idx) => {
                  const cat = categories.find((c) => c.code === q.categoryId || c.id === q.categoryId);
                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        q.isActive
                          ? 'bg-white border-slate-200 shadow-xs hover:border-amber-400'
                          : 'bg-slate-100/70 border-slate-200 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {cat?.name || q.categoryName || q.categoryId}
                            </span>
                            <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 capitalize">
                              {q.questionType === 'multiple_choice' ? 'Pilihan Ganda' : q.questionType === 'true_false' ? 'Benar/Salah' : 'Isian Singkat'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            {q.points} Poin
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-900 line-clamp-3">
                          {q.questionText}
                        </p>

                        {q.imageUrl && (
                          <div className="mt-2 text-[10px] text-blue-600 flex items-center gap-1 font-medium">
                            <span>Lampiran Gambar Tersedia</span>
                          </div>
                        )}

                        <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Kunci Jawaban:
                          </span>
                          <span className="font-semibold text-emerald-800">
                            {q.questionType === 'short_answer'
                              ? q.correctAnswerText || '-'
                              : `${['A', 'B', 'C', 'D'][q.correctOptionIndex ?? 0]}. ${q.options?.[q.correctOptionIndex ?? 0] || '-'}`}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          q.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {q.isActive ? 'Aktif Diujikan' : 'Nonaktif'}
                        </span>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setPreviewQuestion(q)}
                            className="p-1.5 text-slate-600 hover:text-[#0f2b5c] hover:bg-slate-100 rounded-lg"
                            title="Pratinjau Tampilan Santri"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleQuestionActive(q)}
                            className="p-1.5 text-slate-500 hover:text-[#0f2b5c]"
                            title={q.isActive ? 'Nonaktifkan Soal' : 'Aktifkan Soal'}
                          >
                            {q.isActive ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuestionFormTarget(q)}
                            className="p-1.5 text-blue-600 hover:text-blue-800"
                            title="Edit Soal"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q)}
                            className="p-1.5 text-red-500 hover:text-red-700"
                            title="Hapus Soal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: JADWAL SELEKSI ================= */}
        {activeTab === 'schedules' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Jadwal Sesi Ujian Seleksi PPDB
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola sesi pelaksanaan tes CBT, tahfidz, durasi pengerjaan, kuota, dan status sesi ujian.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setScheduleFormTarget('create')}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-white flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                Buat Jadwal Baru
              </button>
            </div>

            {schedules.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Jadwal Tes Belum Dibuat"
                description="Belum ada sesi ujian seleksi yang dijadwalkan."
                actionText="Muat Jadwal Contoh PPDB"
                onAction={handleSeedData}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map((s) => (
                  <div
                    key={s.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          {s.wave}
                        </span>
                        <select
                          value={s.status || 'open'}
                          onChange={(e) => handleScheduleStatusChange(s.id, e.target.value as any)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border outline-none ${
                            s.status === 'open'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : s.status === 'closed'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}
                        >
                          <option value="open">Buka (Open)</option>
                          <option value="closed">Tutup (Closed)</option>
                          <option value="cancelled">Batal (Cancelled)</option>
                        </select>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                      <div className="text-xs text-slate-500 mt-1">
                        Ruang: <strong className="text-slate-800">{s.room}</strong> &bull; Kuota: {s.quota} Santri
                      </div>
                      <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                        Kategori: {s.categoryName || s.categoryId}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <div>{s.examDate}</div>
                        <div className="text-[11px] text-slate-400">
                          {s.startTime} - {s.endTime} ({s.durationMinutes || 90} Mnt)
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setScheduleFormTarget(s)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                          title="Edit Jadwal"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(s)}
                          className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: KONFIGURASI PENILAIAN ================= */}
        {activeTab === 'grading' && (
          <GradingConfigPanel
            categories={categories}
            onCategoriesUpdated={loadData}
          />
        )}

        {/* ================= TAB 6: KEPUTUSAN PENERIMAAN ================= */}
        {activeTab === 'decisions' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Keputusan Penerimaan Santri Baru (Pleno PPDB)
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar penetapan kelulusan calon santri baru yang telah disahkan panitia penerimaan.
                </p>
              </div>
            </div>

            {decisions.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                title="Belum Ada Keputusan Penerimaan"
                description="Belum ada santri yang ditetapkan kelulusannya. Buka tab 'Calon Santri' dan klik aksi penetapan untuk mengesahkan keputusan."
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">No. Registrasi</th>
                      <th className="py-3 px-4">Nama Calon Santri</th>
                      <th className="py-3 px-4">Keputusan Panitia</th>
                      <th className="py-3 px-4">Catatan Pengumuman</th>
                      <th className="py-3 px-4">Tanggal Penetapan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {decisions.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-amber-700">
                          {d.registrationNumber || '-'}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {d.applicantName || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              d.decision === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : d.decision === 'waitlist'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}
                          >
                            {d.decision === 'accepted'
                              ? 'LULUS DITERIMA'
                              : d.decision === 'waitlist'
                              ? 'CADANGAN'
                              : 'TIDAK DITERIMA'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {d.notes}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {d.decisionDate ? new Date(d.decisionDate).toLocaleDateString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Detail Calon Santri */}
      {selectedApplicant && (
        <ApplicantDetailModal
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
        />
      )}

      {/* MODAL 2: Tambah / Edit Calon Santri */}
      {applicantFormTarget && (
        <ApplicantFormModal
          applicant={applicantFormTarget === 'create' ? null : applicantFormTarget}
          onClose={() => setApplicantFormTarget(null)}
          onSaved={() => {
            setApplicantFormTarget(null);
            loadData();
          }}
        />
      )}

      {/* MODAL 3: Impor CSV Calon Santri */}
      {showCsvImport && (
        <CsvImportModal
          onClose={() => setShowCsvImport(false)}
          onImported={() => {
            setShowCsvImport(false);
            loadData();
          }}
        />
      )}

      {/* MODAL 4: Tambah / Edit Kategori */}
      {categoryFormTarget && (
        <CategoryModal
          category={categoryFormTarget === 'create' ? null : categoryFormTarget}
          onClose={() => setCategoryFormTarget(null)}
          onSaved={() => {
            setCategoryFormTarget(null);
            loadData();
          }}
        />
      )}

      {/* MODAL 5: Tambah / Edit Soal */}
      {questionFormTarget && (
        <QuestionModal
          question={questionFormTarget === 'create' ? null : questionFormTarget}
          categories={categories}
          onClose={() => setQuestionFormTarget(null)}
          onSaved={() => {
            setQuestionFormTarget(null);
            loadData();
          }}
        />
      )}

      {/* MODAL 6: Pratinjau Soal */}
      {previewQuestion && (
        <QuestionPreviewModal
          question={previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      )}

      {/* MODAL 7: Tambah / Edit Jadwal */}
      {scheduleFormTarget && (
        <ScheduleModal
          schedule={scheduleFormTarget === 'create' ? null : scheduleFormTarget}
          categories={categories}
          onClose={() => setScheduleFormTarget(null)}
          onSaved={() => {
            setScheduleFormTarget(null);
            loadData();
          }}
        />
      )}

      {/* MODAL 8: Penetapan Keputusan Kelulusan */}
      {decisionModalApplicant && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Penetapan Keputusan Kelulusan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDecisionModalApplicant(null)}
                className="text-slate-300 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Calon Santri</div>
                  <div className="text-sm font-bold text-slate-900">{decisionModalApplicant.fullName}</div>
                  <div className="text-slate-600 font-mono text-xs">{decisionModalApplicant.registrationNumber} &bull; {decisionModalApplicant.program}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApplicantForRecap(decisionModalApplicant)}
                  className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-amber-500/10 text-amber-800 border border-amber-300 hover:bg-amber-500/20 flex items-center gap-1.5"
                  title="Lihat Rekapitulasi Nilai Sebelum Pengesahan"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  Lihat Rekap Nilai
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Status Kelulusan *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionChoice('accepted')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      decisionChoice === 'accepted'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Diterima (Lulus)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionChoice('waitlist')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      decisionChoice === 'waitlist'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Cadangan
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionChoice('rejected')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      decisionChoice === 'rejected'
                        ? 'bg-red-600 text-white border-red-700 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tidak Lulus
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Resmi Panitia
                </label>
                <textarea
                  rows={3}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Contoh: Selamat, Ananda dinyatakan LULUS pada program Tahfidz Reguler Pondok Pesantren Al Ikhlas."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecisionModalApplicant(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0f2b5c] text-white hover:bg-[#153a7a]"
                >
                  {submittingDecision ? 'Menyimpan...' : 'Sahkan Keputusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: Rekapitulasi Nilai Multi-Kategori Calon Santri */}
      {selectedApplicantForRecap && (
        <ScoreRecapModal
          applicant={selectedApplicantForRecap}
          onClose={() => setSelectedApplicantForRecap(null)}
        />
      )}

      {/* MODAL 10: Detail Hasil Komprehensif & Penetapan Keputusan Pleno */}
      {selectedApplicantForResultDetail && (
        <ApplicantResultDetailModal
          applicant={selectedApplicantForResultDetail}
          decision={decisionsMap.get(selectedApplicantForResultDetail.id) || null}
          onClose={() => setSelectedApplicantForResultDetail(null)}
          onDecisionUpdated={() => {
            loadData();
          }}
        />
      )}

      {/* MODAL 11: Pengaturan Pengumuman & Publikasi */}
      {showAnnouncementSettings && announcementConfig && (
        <AnnouncementSettingsModal
          config={announcementConfig}
          onClose={() => setShowAnnouncementSettings(false)}
          onSaved={(updated) => {
            setAnnouncementConfig(updated);
            loadData();
          }}
        />
      )}

      {/* MODAL 12: Audit Log Keputusan Pleno */}
      {showAuditLogs && (
        <DecisionAuditHistoryModal
          onClose={() => setShowAuditLogs(false)}
        />
      )}

      {/* MODAL 13: Cetak Laporan Resmi Format Surat PPDB */}
      {printReportMode && (
        <PrintableReportView
          applicants={applicants}
          results={resultsMap}
          decisions={decisionsMap}
          categories={categories}
          initialFilter={printReportMode}
          onClose={() => setPrintReportMode(null)}
        />
      )}
    </div>
  );
};
