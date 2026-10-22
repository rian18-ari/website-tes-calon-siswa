import React, { useState } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  XCircle,
  FileSpreadsheet,
  Printer,
  Settings,
  History,
  Search,
  Filter,
  Eye,
  BarChart3,
  TrendingUp,
  Layers,
  Sparkles,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  Applicant,
  AdmissionDecision,
  TestCategory,
  TestResult,
  PPDBStatistics,
  ScoreDistribution,
  CategoryPerformanceStat,
  ProgramStat,
} from '../../../types/ppdb';
import { generatePPDBReportCsv } from '../../../services/ppdbService';

interface SelectionResultsDashboardProps {
  stats: PPDBStatistics;
  scoreDistribution: ScoreDistribution[];
  categoryPerformance: CategoryPerformanceStat[];
  programStats: ProgramStat[];
  applicants: Applicant[];
  results: Map<string, TestResult>;
  decisions: Map<string, AdmissionDecision>;
  categories: TestCategory[];
  onOpenApplicantDetail: (applicant: Applicant) => void;
  onOpenAnnouncementSettings: () => void;
  onOpenAuditLogs: () => void;
  onOpenPrintReport: (filterMode?: string) => void;
  onRefresh: () => void;
}

export const SelectionResultsDashboard: React.FC<SelectionResultsDashboardProps> = ({
  stats,
  scoreDistribution,
  categoryPerformance,
  programStats,
  applicants,
  results,
  decisions,
  categories,
  onOpenApplicantDetail,
  onOpenAnnouncementSettings,
  onOpenAuditLogs,
  onOpenPrintReport,
  onRefresh,
}) => {
  // Table filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'accepted' | 'waitlist' | 'rejected' | 'pending' | 'incomplete'>('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [sortField, setSortField] = useState<'score' | 'name' | 'regNo'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle CSV Export
  const handleExportCsv = () => {
    const csvContent = generatePPDBReportCsv(applicants, results, decisions, categories);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Hasil_Seleksi_PPDB_Al_Ikhlas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered applicants
  const filteredApplicants = applicants.filter((a) => {
    if (a.status === 'archived') return false;

    // Search query
    const matchesSearch =
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nisn.includes(searchQuery);

    // Program filter
    const matchesProgram = programFilter === 'all' || a.program === programFilter;

    // Status filter
    const dec = decisions.get(a.id);
    const res = results.get(a.id);
    let matchesStatus = true;

    if (statusFilter === 'accepted') {
      matchesStatus = dec?.decision === 'accepted';
    } else if (statusFilter === 'rejected') {
      matchesStatus = dec?.decision === 'rejected';
    } else if (statusFilter === 'waitlist') {
      matchesStatus = dec?.decision === 'waitlist';
    } else if (statusFilter === 'pending') {
      matchesStatus = !dec && (!res || res.isCompleted);
    } else if (statusFilter === 'incomplete') {
      matchesStatus = !res || !res.isCompleted;
    }

    return matchesSearch && matchesProgram && matchesStatus;
  });

  // Sort
  const sortedApplicants = [...filteredApplicants].sort((a, b) => {
    if (sortField === 'score') {
      const scoreA = results.get(a.id)?.totalScore ?? -1;
      const scoreB = results.get(b.id)?.totalScore ?? -1;
      return sortDirection === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    } else if (sortField === 'name') {
      return sortDirection === 'desc'
        ? b.fullName.localeCompare(a.fullName)
        : a.fullName.localeCompare(b.fullName);
    } else {
      return sortDirection === 'desc'
        ? b.registrationNumber.localeCompare(a.registrationNumber)
        : a.registrationNumber.localeCompare(b.registrationNumber);
    }
  });

  const distinctPrograms = Array.from(new Set(applicants.map((a) => a.program).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Action Header Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-amber-600" />
            Sidang Pleno & Rekapitulasi Seleksi
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Hasil Akhir Penilaian & Keputusan Kelulusan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrasi nilai multi-kategori, penetapan keputusan pleno, ekspor laporan resmi, dan kontrol publikasi hasil.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAnnouncementSettings}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
            title="Kelola Publikasi Hasil Pengumuman"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            Pengaturan Pengumuman
          </button>

          <button
            type="button"
            onClick={onOpenAuditLogs}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
            title="Riwayat Perubahan Keputusan Pleno"
          >
            <History className="w-4 h-4 text-slate-600" />
            Audit Log Keputusan
          </button>

          <button
            type="button"
            onClick={() => onOpenPrintReport('all')}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
            title="Cetak Laporan Resmi Format Surat PPDB"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            Cetak Laporan
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors flex items-center gap-1.5"
            title="Unduh Data Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            Ekspor Excel / CSV
          </button>
        </div>
      </div>

      {/* 7 Core Statistical Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. Total */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Total Pendaftar</div>
          <div className="text-2xl font-bold font-serif text-slate-900 mt-1">{stats.totalApplicants}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Calon Santri</div>
        </div>

        {/* 2. Untested */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Belum Tes</div>
          <div className="text-2xl font-bold font-serif text-amber-600 mt-1">{stats.untestedApplicants}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Menunggu Jadwal</div>
        </div>

        {/* 3. Tested */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Selesai Tes</div>
          <div className="text-2xl font-bold font-serif text-blue-700 mt-1">{stats.testedApplicants}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sudah Mengikuti Tes</div>
        </div>

        {/* 4. Incomplete */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Belum Lengkap</div>
          <div className="text-2xl font-bold font-serif text-purple-700 mt-1">{stats.incompleteAssessmentApplicants}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ada Kategori Kosong</div>
        </div>

        {/* 5. Accepted */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-800">Santri Lulus</div>
          <div className="text-2xl font-bold font-serif text-emerald-700 mt-1">{stats.acceptedApplicants}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Diterima Resmi</div>
        </div>

        {/* 6. Rejected */}
        <div className="bg-white rounded-2xl p-4 border border-red-200 bg-red-50/30 shadow-2xs">
          <div className="text-[11px] font-bold text-red-800">Tidak Lulus</div>
          <div className="text-2xl font-bold font-serif text-red-700 mt-1">{stats.rejectedApplicants}</div>
          <div className="text-[10px] text-red-600 mt-0.5">Belum Memenuhi</div>
        </div>

        {/* 7. Pending Decision */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/30 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-800">Menunggu Pleno</div>
          <div className="text-2xl font-bold font-serif text-amber-700 mt-1">{stats.pendingDecisionApplicants}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Siap Ditetapkan</div>
        </div>
      </div>

      {/* Visual Analytics Grid: Score Distribution & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Score Distribution Chart */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0f2b5c]" />
                Distribusi Nilai Akhir Seleksi
              </h3>
              <p className="text-xs text-slate-500">
                Sebaran nilai agregat (0-100) seluruh peserta yang telah dihitung.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">Rata-rata: {stats.averageScore || 0}</div>
              <div className="text-[10px] text-slate-500">Tingkat Lulus: {stats.passingRate || 0}%</div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {scoreDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.range}</span>
                  <span className="font-semibold text-slate-900">
                    {item.count} Santri <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      idx >= 3 ? 'bg-emerald-600' : idx === 2 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.max(item.percentage, item.count > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Standar KKM Kelulusan Agregat: <strong>75 Poin</strong></span>
            <span className="text-emerald-700 font-semibold">Tersimpan di Cloud Firestore</span>
          </div>
        </div>

        {/* Right: Category Performance Averages */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              Kinerja 5 Kategori Ujian Masuk
            </h3>
            <p className="text-xs text-slate-500">
              Rata-rata nilai dan batas KKM per kategori ujian seleksi pesantren.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {categoryPerformance.map((cat) => (
              <div
                key={cat.categoryId}
                className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{cat.categoryName}</div>
                  <div className="text-[10px] text-slate-500">
                    Bobot: <strong>{cat.weight}%</strong> &bull; KKM: <strong>{cat.passingGrade}</strong> &bull; Dinilai: {cat.testedCount} Santri
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-[#0f2b5c]">
                    Rata: {cat.averageScore}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Min: {cat.lowestScore} / Max: {cat.highestScore}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Program / Jenjang Breakdown */}
      {programStats.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Ringkasan Berdasarkan Jenjang & Program Pendidikan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {programStats.map((p, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-xs text-slate-900 truncate">{p.program}</div>
                <div className="text-xl font-bold font-serif text-slate-800">{p.total} <span className="text-xs font-normal text-slate-500">Calon Santri</span></div>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  <span className="text-emerald-700 font-bold">Lulus: {p.accepted}</span>
                  <span className="text-amber-700 font-bold">Cadangan: {p.waitlist}</span>
                  <span className="text-red-700 font-bold">Tidak: {p.rejected}</span>
                  <span className="text-slate-500">Pending: {p.pending}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Selection Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search & Program Filter */}
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari santri berdasarkan nama, nomor registrasi, NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-700"
            >
              <option value="all">Semua Program</option>
              {distinctPrograms.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({applicants.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('accepted')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'accepted' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lulus ({stats.acceptedApplicants})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('waitlist')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'waitlist' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cadangan ({stats.waitlistApplicants})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'rejected' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tidak Lulus ({stats.rejectedApplicants})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('incomplete')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'incomplete' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum Lengkap ({stats.incompleteAssessmentApplicants})
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Registrasi</th>
                <th className="py-3 px-4">Nama Calon Santri</th>
                <th className="py-3 px-4">Program & Asal</th>
                <th className="py-3 px-4 text-center">Kelengkapan Tes</th>
                <th className="py-3 px-4 text-center">Nilai Akhir</th>
                <th className="py-3 px-4">Rekomendasi Sistem</th>
                <th className="py-3 px-4">Keputusan Panitia</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedApplicants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada calon santri yang sesuai kriteria pencarian dan filter.
                  </td>
                </tr>
              ) : (
                sortedApplicants.map((a) => {
                  const res = results.get(a.id);
                  const dec = decisions.get(a.id);

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                        {a.registrationNumber}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {a.fullName}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">{a.program}</div>
                        <div className="text-[11px] text-slate-400">{a.previousSchool || 'Sekolah Asal'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {res ? (
                          res.isCompleted ? (
                            <span className="text-[11px] font-semibold text-emerald-700 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Lengkap (5 Kategori)
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-purple-700 flex items-center justify-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-purple-600" />
                              Kurang ({res.missingCategories?.length || 0})
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400">Belum Tes</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {res ? (
                          <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {res.totalScore}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {res?.automaticRecommendation ? (
                          <span
                            className={`text-[11px] font-bold ${
                              res.automaticRecommendation === 'recommended_accepted'
                                ? 'text-emerald-700'
                                : res.automaticRecommendation === 'recommended_waitlist'
                                ? 'text-amber-700'
                                : res.automaticRecommendation === 'recommended_rejected'
                                ? 'text-red-700'
                                : 'text-purple-700'
                            }`}
                          >
                            {res.automaticRecommendation === 'recommended_accepted'
                              ? 'Disarankan Lulus'
                              : res.automaticRecommendation === 'recommended_waitlist'
                              ? 'Disarankan Cadangan'
                              : res.automaticRecommendation === 'recommended_rejected'
                              ? 'Disarankan Tidak Lulus'
                              : 'Penilaian Belum Lengkap'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {dec ? (
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                              dec.decision === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : dec.decision === 'waitlist'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}
                          >
                            {dec.decision === 'accepted'
                              ? 'LULUS DITERIMA'
                              : dec.decision === 'waitlist'
                              ? 'CADANGAN'
                              : 'TIDAK LULUS'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            Menunggu Pleno
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenApplicantDetail(a)}
                          className="px-3 py-1.5 rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                          title="Lihat Detail Hasil & Sahkan Keputusan"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-300" />
                          <span>Detail Hasil</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
