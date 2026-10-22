import React, { useEffect, useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Scale,
  FileText,
  Building2,
  Calendar,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  History,
  Check,
  XCircle,
} from 'lucide-react';
import {
  Applicant,
  AdmissionDecision,
  ExaminerAssessment,
  TestCategory,
  TestResult,
  TestSession,
  DecisionAuditLog,
} from '../../types/ppdb';
import {
  getTestCategories,
  getExaminerAssessments,
  getApplicantTestResult,
  getDecisionAuditLogs,
  recalculateApplicantResult,
  submitAdmissionDecision,
} from '../../services/ppdbService';
import { useAuth } from '../../contexts/AuthContext';

interface ApplicantResultDetailModalProps {
  applicant: Applicant;
  decision?: AdmissionDecision | null;
  onClose: () => void;
  onDecisionUpdated: () => void;
}

export const ApplicantResultDetailModal: React.FC<ApplicantResultDetailModalProps> = ({
  applicant,
  decision: initialDecision,
  onClose,
  onDecisionUpdated,
}) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const [result, setResult] = useState<TestResult | null>(null);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [assessments, setAssessments] = useState<ExaminerAssessment[]>([]);
  const [auditLogs, setAuditLogs] = useState<DecisionAuditLog[]>([]);
  const [currentDecision, setCurrentDecision] = useState<AdmissionDecision | null>(initialDecision || null);
  const [loading, setLoading] = useState<boolean>(true);

  // Decision Form State
  const [selectedDecision, setSelectedDecision] = useState<'accepted' | 'waitlist' | 'rejected'>('accepted');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [showAuditHistory, setShowAuditHistory] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catList, allAssessments, resData, logs] = await Promise.all([
          getTestCategories(),
          getExaminerAssessments(),
          recalculateApplicantResult(applicant.id),
          getDecisionAuditLogs(applicant.id),
        ]);

        setCategories(catList);
        setAssessments(allAssessments.filter((a) => a.applicantId === applicant.id));
        setResult(resData);
        setAuditLogs(logs);

        if (initialDecision) {
          setSelectedDecision(initialDecision.decision === 'pending' ? 'accepted' : initialDecision.decision);
          setDecisionNotes(initialDecision.notes || '');
        }
      } catch (err) {
        console.error('Error fetching applicant result details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [applicant.id, initialDecision]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecisionError(null);

    // Strict validation: Do not allow blind acceptance if mandatory categories are incomplete!
    if (selectedDecision === 'accepted' && result && !result.isCompleted) {
      const confirmOverride = window.confirm(
        `PERINGATAN PANITIA PPDB:\n\nPenilaian calon santri ini belum lengkap (masih kurang ${result.missingCategories?.join(', ')}).\n\nApakah Anda benar-benar yakin ingin menetapkan status LULUS meskipun data nilai belum lengkap?`
      );
      if (!confirmOverride) {
        return;
      }
    }

    setSubmittingDecision(true);
    try {
      await submitAdmissionDecision(
        {
          applicantId: applicant.id,
          applicantName: applicant.fullName,
          registrationNumber: applicant.registrationNumber,
          decision: selectedDecision,
          notes:
            decisionNotes ||
            (selectedDecision === 'accepted'
              ? 'Selamat, Ananda dinyatakan LULUS SELEKSI PPDB Pondok Pesantren Al Ikhlas.'
              : selectedDecision === 'waitlist'
              ? 'Ananda dimasukkan dalam daftar CADANGAN seleksi PPDB Pondok Pesantren Al Ikhlas.'
              : 'Mohon maaf, Ananda belum memenuhi kriteria kelulusan seleksi PPDB Pondok Pesantren Al Ikhlas.'),
          decidedBy: userProfile?.displayName || userProfile?.email || 'Panitia PPDB',
          decidedByEmail: userProfile?.email,
        },
        auditReason || 'Penetapan keputusan sidang pleno PPDB.'
      );

      setCurrentDecision({
        id: 'new',
        applicantId: applicant.id,
        applicantName: applicant.fullName,
        registrationNumber: applicant.registrationNumber,
        decision: selectedDecision,
        notes: decisionNotes,
        decisionDate: new Date().toISOString(),
        decidedBy: userProfile?.displayName || 'Panitia PPDB',
      });

      // Reload audit logs
      const updatedLogs = await getDecisionAuditLogs(applicant.id);
      setAuditLogs(updatedLogs);

      onDecisionUpdated();
    } catch (err: any) {
      setDecisionError(err.message || 'Gagal menyimpan keputusan panitia.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#091a32] via-[#0f2b5c] to-[#15325b] text-white p-5 flex items-center justify-between border-b border-amber-400/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-amber-300">
                Lembar Hasil Seleksi & Rekapitulasi Pleno
              </div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                {applicant.fullName}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <div className="w-6 h-6 border-2 border-[#0f2b5c] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Memuat rincian hasil tes dan catatan penguji...</p>
            </div>
          ) : (
            <>
              {/* Top Profile Strip */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {applicant.registrationNumber}
                    </span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="font-semibold text-slate-800">NISN: {applicant.nisn}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-600">{applicant.gender === 'L' ? 'Ikhwan (Laki-laki)' : 'Akhwat (Perempuan)'}</span>
                  </div>
                  <div className="text-slate-500">
                    Program: <strong className="text-slate-800">{applicant.program}</strong> &bull; {applicant.wave} &bull; Asal: {applicant.previousSchool}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Completeness Badge */}
                  {result?.isCompleted ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>5 Kategori Lengkap</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>Kurang {result?.missingCategories?.length} Kategori</span>
                    </div>
                  )}

                  {/* Final Decision Badge */}
                  {currentDecision ? (
                    <span
                      className={`px-3 py-1 rounded-xl font-bold border ${
                        currentDecision.decision === 'accepted'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : currentDecision.decision === 'waitlist'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-red-600 text-white border-red-700 shadow-xs'
                      }`}
                    >
                      {currentDecision.decision === 'accepted'
                        ? 'LULUS'
                        : currentDecision.decision === 'waitlist'
                        ? 'CADANGAN'
                        : 'TIDAK LULUS'}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl font-semibold bg-slate-200 text-slate-700">
                      Belum Diplenokan
                    </span>
                  )}
                </div>
              </div>

              {/* Automatic System Recommendation Banner */}
              {result && (
                <div
                  className={`p-4 rounded-2xl border ${
                    result.automaticRecommendation === 'recommended_accepted'
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : result.automaticRecommendation === 'recommended_waitlist'
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                      : result.automaticRecommendation === 'recommended_rejected'
                      ? 'bg-red-50/80 border-red-300 text-red-950'
                      : 'bg-purple-50/80 border-purple-300 text-purple-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-lg bg-white/70">
                      {result.automaticRecommendation === 'recommended_accepted' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                      ) : result.automaticRecommendation === 'recommended_waitlist' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-700" />
                      ) : result.automaticRecommendation === 'recommended_rejected' ? (
                        <XCircle className="w-5 h-5 text-red-700" />
                      ) : (
                        <Clock className="w-5 h-5 text-purple-700" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wide">
                        Rekomendasi Otomatis Berdasarkan Passing Grade & KKM:
                      </div>
                      <p className="mt-0.5 leading-relaxed">
                        {result.recommendationReason || 'Menunggu verifikasi nilai sistem.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-Category Scores & Formula Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600" />
                    Rincian Nilai per Kategori & Perhitungan Terbobot
                  </h4>
                  <div className="text-slate-500">
                    Nilai Akhir: <strong className="text-sm font-mono text-slate-900">{result?.totalScore || 0} / 100</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((c) => {
                    const score =
                      result?.categoryScores[c.code] !== undefined
                        ? result.categoryScores[c.code]
                        : result?.categoryScores[c.id];

                    const isAssessed = score !== undefined;
                    const isPassing = isAssessed && score >= c.passingGrade;
                    const weightedContrib = isAssessed ? ((score * c.weight) / 100).toFixed(1) : '-';

                    return (
                      <div
                        key={c.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          !isAssessed
                            ? 'bg-slate-50 border-dashed border-slate-300 opacity-70'
                            : isPassing
                            ? 'bg-white border-slate-200'
                            : 'bg-red-50/40 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="font-bold text-slate-900 truncate">{c.name}</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex-shrink-0">
                            {c.weight}%
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between mt-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Nilai Capaian:</span>
                            <span
                              className={`text-xl font-mono font-bold ${
                                !isAssessed
                                  ? 'text-slate-400'
                                  : isPassing
                                  ? 'text-emerald-700'
                                  : 'text-red-600'
                              }`}
                            >
                              {isAssessed ? score : 'Belum Tes'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">KKM: {c.passingGrade}</span>
                            <span className="text-[11px] font-mono text-slate-600">
                              Kontribusi: +{weightedContrib}
                            </span>
                          </div>
                        </div>

                        {c.code === 'AKADEMIK' && result?.cbtScore !== undefined && (
                          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                            <span>Benar: {result.cbtCorrectCount ?? '-'}</span>
                            <span>Salah: {result.cbtIncorrectCount ?? '-'}</span>
                            <span>Kosong: {result.cbtUnansweredCount ?? '-'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Mathematical Formula Display */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                  <div className="font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                    Rumus Perhitungan Nilai Akhir:
                  </div>
                  <div className="font-mono text-[11px] text-slate-800 bg-white p-2 rounded-lg border border-slate-200 overflow-x-auto">
                    Nilai Akhir = {categories.map((c) => `(${c.name} x ${c.weight}%)`).join(' + ')}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Hasil kalkulasi disimpan permanen dengan versi konfigurasi pembobotan aktif saat penilaian dilakukan.
                  </div>
                </div>
              </div>

              {/* Examiner Qualitative Assessments & Notes */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Catatan Kualitatif Asatidz Penguji
                </h4>

                {assessments.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-center">
                    Belum ada catatan ujian lisan atau wawancara yang dicatat oleh penguji.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {assessments.map((ass) => (
                      <div
                        key={ass.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-900">
                            {ass.categoryName || ass.categoryId} &bull; <span className="font-mono text-amber-700">Skor: {ass.totalScore}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Penguji: <strong>{ass.examinerName || 'Ustadz Penguji'}</strong>
                          </div>
                        </div>

                        <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                          &ldquo;{ass.notes}&rdquo;
                        </p>

                        {/* Aspect breakdown */}
                        <div className="flex flex-wrap gap-2 pt-1 text-[10px]">
                          {Object.entries(ass.aspectScores || {}).map(([key, val]) => (
                            <span key={key} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                              {key.replace(/_/g, ' ')}: {val}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panitia Decision Form (Admin Only) */}
              {isAdmin && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-amber-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Sidang Penetapan Kelulusan Panitia PPDB</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAuditHistory(!showAuditHistory)}
                      className="text-amber-800 hover:text-amber-950 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>{showAuditHistory ? 'Sembunyikan Riwayat' : `Riwayat Audit (${auditLogs.length})`}</span>
                    </button>
                  </div>

                  {decisionError && (
                    <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{decisionError}</span>
                    </div>
                  )}

                  <form onSubmit={handleDecisionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1.5">
                        Pilih Status Kelulusan Akhir *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDecision('accepted')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            selectedDecision === 'accepted'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Diterima (Lulus)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDecision('waitlist')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            selectedDecision === 'waitlist'
                              ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Cadangan
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDecision('rejected')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            selectedDecision === 'rejected'
                              ? 'bg-red-600 text-white border-red-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Tidak Lulus
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
                        Catatan Resmi Surat Keputusan (Ditampilkan ke Peserta jika Diumumkan)
                      </label>
                      <textarea
                        rows={2}
                        value={decisionNotes}
                        onChange={(e) => setDecisionNotes(e.target.value)}
                        placeholder="Contoh: Selamat, Ananda dinyatakan LULUS SELEKSI pada program Tahfidz Reguler Pondok Pesantren Al Ikhlas."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
                        Alasan / Justifikasi Audit (Internal Log Panitia)
                      </label>
                      <input
                        type="text"
                        value={auditReason}
                        onChange={(e) => setAuditReason(e.target.value)}
                        placeholder="Contoh: Berdasarkan hasil sidang pleno asatidz tanggal 22 Oktober 2026."
                        className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={submittingDecision}
                        className="px-5 py-2.5 rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-white font-bold transition-colors shadow-sm flex items-center gap-2"
                      >
                        <Check className="w-4 h-4 text-amber-300" />
                        <span>{submittingDecision ? 'Menyimpan Keputusan...' : 'Sahkan & Simpan Keputusan'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Audit History Panel */}
              {showAuditHistory && (
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-3">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-600" />
                    <span>Riwayat Audit Perubahan Keputusan Calon Santri Ini</span>
                  </div>

                  {auditLogs.length === 0 ? (
                    <div className="text-slate-500 italic">Belum ada riwayat perubahan keputusan.</div>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">
                              Oleh: {log.changedBy} ({log.newDecision.toUpperCase()})
                            </span>
                            <span className="text-slate-400 font-mono">
                              {new Date(log.timestamp).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="text-slate-600">Alasan: {log.reason}</div>
                          {log.previousDecision && (
                            <div className="text-slate-400 text-[10px]">
                              Status sebelumnya: {log.previousDecision}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0 text-xs">
          <span className="text-slate-500">
            Pondok Pesantren Al Ikhlas &bull; Sistem PPDB Terpadu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
