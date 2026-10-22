import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  UserCheck,
  FileEdit,
  GraduationCap,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Scale,
  Check,
} from 'lucide-react';
import { Applicant, ExaminerAssessment, TestCategory } from '../../../types/ppdb';
import {
  getAllApplicants,
  getExaminerAssessments,
  getTestCategories,
  seedPPDBMasterData,
} from '../../../services/ppdbService';
import { useAuth } from '../../../contexts/AuthContext';
import { StatsCard } from '../../common/StatsCard';
import { EmptyState } from '../../common/EmptyState';
import { ManualAssessmentModal } from '../../modals/ManualAssessmentModal';
import { ApplicantDetailModal } from '../../modals/ApplicantDetailModal';
import { ScoreRecapModal } from '../../results/ScoreRecapModal';

export const ExaminerDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [assessments, setAssessments] = useState<ExaminerAssessment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'completed'>('all');

  const [selectedApplicantForScoring, setSelectedApplicantForScoring] = useState<Applicant | null>(null);
  const [selectedApplicantForDetail, setSelectedApplicantForDetail] = useState<Applicant | null>(null);
  const [selectedApplicantForRecap, setSelectedApplicantForRecap] = useState<Applicant | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allApplicants, allCategories, allAssessments] = await Promise.all([
        getAllApplicants(false),
        getTestCategories(),
        getExaminerAssessments(),
      ]);

      setApplicants(allApplicants);
      setCategories(allCategories);
      setAssessments(allAssessments);
    } catch (err) {
      console.error('Error loading examiner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAssigned = applicants.length;
  // Calculate completed if has at least 1 assessment or status tested
  const completedApplicantIds = new Set(
    assessments.filter((a) => !a.isDraft).map((a) => a.applicantId)
  );
  const totalCompleted = applicants.filter((a) => completedApplicantIds.has(a.id)).length;
  const totalPending = Math.max(0, totalAssigned - totalCompleted);

  const filteredApplicants = applicants.filter((a) => {
    const isCompleted = completedApplicantIds.has(a.id);
    const matchesSearch =
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'pending') return !isCompleted;
    if (filterType === 'completed') return isCompleted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Examiner Header */}
      <div className="bg-gradient-to-r from-[#091a32] via-[#0f2b5c] to-[#153a7a] rounded-3xl p-6 text-white shadow-xl border border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-amber-400" />
            Panel Dewan Asatidz Penguji PPDB
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold">
            Ujian Lisan, Tahfidz, Wawancara & Praktik
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Penguji: <strong className="text-amber-200">{userProfile?.displayName || 'Ustadz Penguji'}</strong> &bull; Berikan penilaian rubrik tajwid, kelancaran tahfidz, adab/akhlak, dan praktik ibadah santri secara objektif.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Menunggu Penilaian"
          value={totalPending}
          icon={Clock}
          description="Santri belum selesai diuji manual"
          accentColor="amber"
          badgeText="Perlu Dinilai"
        />
        <StatsCard
          title="Selesai Dinilai"
          value={totalCompleted}
          icon={CheckCircle2}
          description="Nilai manual telah disahkan ke sistem"
          accentColor="emerald"
          badgeText="Selesai"
        />
        <StatsCard
          title="Total Santri Ditugaskan"
          value={totalAssigned}
          icon={UserCheck}
          description="Kapasitas calon santri gelombang ini"
          accentColor="blue"
          badgeText="Kapasitas"
        />
      </div>

      {/* Main Scoring Workspace */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Santri untuk Penilaian Manual
            </h3>
            <p className="text-xs text-slate-500">
              Pilih santri untuk membuka lembar penilaian 4 kategori manual (Al-Qur&apos;an, Tahfidz, Wawancara, Praktik).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari santri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Semua ({applicants.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('pending')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterType === 'pending' ? 'bg-white text-amber-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Menunggu ({totalPending})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('completed')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterType === 'completed' ? 'bg-white text-emerald-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Selesai ({totalCompleted})
              </button>
            </div>
          </div>
        </div>

        {/* Applicants List */}
        {filteredApplicants.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Tidak Ada Santri dalam Daftar Penilaian"
            description="Tidak ada santri yang cocok dengan kriteria filter."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredApplicants.map((applicant) => {
              const myAssessments = assessments.filter((a) => a.applicantId === applicant.id);
              const isFullyAssessed = myAssessments.length >= 2;

              return (
                <div
                  key={applicant.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        {applicant.registrationNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {applicant.wave}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{applicant.fullName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {applicant.program} &bull; Asal: {applicant.previousSchool}
                    </p>

                    {/* Category Assessment Status Badges */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {['QURAN', 'HAFALAN', 'WAWANCARA', 'PRAKTIK'].map((catCode) => {
                        const ass = myAssessments.find((a) => a.categoryId === catCode);
                        const isDone = Boolean(ass && !ass.isDraft);
                        const isDraft = Boolean(ass && ass.isDraft);

                        const labelMap: Record<string, string> = {
                          QURAN: 'Al-Qur\'an',
                          HAFALAN: 'Tahfidz',
                          WAWANCARA: 'Wawancara',
                          PRAKTIK: 'Praktik',
                        };

                        return (
                          <span
                            key={catCode}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : isDraft
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3 text-emerald-600" />}
                            <span>{labelMap[catCode]}</span>
                            {isDone && <strong className="ml-0.5">({ass?.totalScore})</strong>}
                            {isDraft && <span className="text-[9px]">(Draft)</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedApplicantForDetail(applicant)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        Biodata
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedApplicantForRecap(applicant)}
                        className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Rekap Nilai</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedApplicantForScoring(applicant)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-white shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-amber-300" />
                      <span>Input / Ubah Nilai</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Scoring Modal */}
      {selectedApplicantForScoring && (
        <ManualAssessmentModal
          applicant={selectedApplicantForScoring}
          categories={categories}
          onClose={() => setSelectedApplicantForScoring(null)}
          onSaved={() => {
            setSelectedApplicantForScoring(null);
            loadData();
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedApplicantForDetail && (
        <ApplicantDetailModal
          applicant={selectedApplicantForDetail}
          onClose={() => setSelectedApplicantForDetail(null)}
        />
      )}

      {/* Score Recap Modal */}
      {selectedApplicantForRecap && (
        <ScoreRecapModal
          applicant={selectedApplicantForRecap}
          onClose={() => setSelectedApplicantForRecap(null)}
        />
      )}
    </div>
  );
};
