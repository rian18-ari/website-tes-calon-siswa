import React, { useEffect, useState } from 'react';
import {
  X,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Scale,
  FileText,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Applicant, ExaminerAssessment, TestCategory, TestResult } from '../../types/ppdb';
import {
  getTestCategories,
  getExaminerAssessments,
  recalculateApplicantResult,
} from '../../services/ppdbService';

interface ScoreRecapModalProps {
  applicant: Applicant;
  onClose: () => void;
}

export const ScoreRecapModal: React.FC<ScoreRecapModalProps> = ({
  applicant,
  onClose,
}) => {
  const [result, setResult] = useState<TestResult | null>(null);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [assessments, setAssessments] = useState<ExaminerAssessment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catList, allAssessments, resData] = await Promise.all([
          getTestCategories(),
          getExaminerAssessments(),
          recalculateApplicantResult(applicant.id),
        ]);

        setCategories(catList);
        setAssessments(allAssessments.filter((a: ExaminerAssessment) => a.applicantId === applicant.id));
        setResult(resData);
      } catch (err) {
        console.error('Error fetching score recap:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [applicant.id]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-500 shadow-2xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
          <span>Menghitung rekapitulasi nilai seleksi santri...</span>
        </div>
      </div>
    );
  }

  const activeCategories = categories.filter((c) => c.isActive !== false);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Scale className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Rekapitulasi Nilai Seleksi & Status Kelulusan
              </h3>
              <p className="text-xs text-slate-300">
                Pondok Pesantren Al Ikhlas &bull; Seleksi Calon Santri Baru
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Candidate Info */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0f2b5c] text-amber-300 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{applicant.fullName}</div>
              <div className="text-slate-500 font-mono text-[11px]">
                No. Reg: <strong className="text-amber-700">{applicant.registrationNumber}</strong> &bull; {applicant.program}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kelengkapan Nilai:</span>
            <span
              className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-xs ${
                result?.isCompleted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {result?.isCompleted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Lengkap (Siap Pleno)
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Belum Lengkap ({result?.missingCategories?.length} Belum Dinilai)
                </>
              )}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Total Weighted Score Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#091a32] to-[#153a7a] text-white flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Total Skor Tertimbang Sementara
              </span>
              <p className="text-xs text-slate-300 mt-1 max-w-sm">
                Akumulasi bobot persentase dari seluruh kategori tes yang telah diselesaikan.
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-serif font-black text-white">
                {result?.totalScore || 0}
              </span>
              <span className="text-xs text-amber-300 block font-semibold">/ 100 Poin</span>
            </div>
          </div>

          {/* Missing Categories Notice if any */}
          {!result?.isCompleted && (
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Penilaian Belum Lengkap:</span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Santri masih belum dinilai pada materi: <strong>{result?.missingCategories?.join(', ')}</strong>. Nilai akhir dan keputusan kelulusan belum dapat disahkan sebelum semua ujian diselesaikan.
                </p>
              </div>
            </div>
          )}

          {/* Breakdown per Category */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rincian Perolehan Nilai per Kategori:
            </h4>

            <div className="space-y-2.5">
              {activeCategories.map((cat) => {
                const isCbt = cat.type === 'cbt';
                const score = result?.categoryScores[cat.code] !== undefined
                  ? result?.categoryScores[cat.code]
                  : result?.categoryScores[cat.id];

                const ass = assessments.find((a) => a.categoryId === cat.code || a.categoryId === cat.id);
                const isGraded = score !== undefined;

                return (
                  <div
                    key={cat.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isGraded
                        ? 'bg-white border-slate-200 shadow-xs'
                        : 'bg-slate-50/70 border-dashed border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Bobot: {cat.weight}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {isGraded ? (
                          <div>
                            <span className={`text-base font-bold ${
                              score >= cat.passingGrade ? 'text-emerald-700' : 'text-amber-800'
                            }`}>
                              {score} / 100
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              KKM: {cat.passingGrade}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Menunggu Ujian
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Additional CBT or Examiner notes */}
                    {isCbt && result?.cbtScore !== undefined && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
                          Benar: <strong>{result.cbtCorrectCount || 0}</strong>
                        </div>
                        <div className="p-1.5 bg-red-50 text-red-800 rounded-lg">
                          Salah: <strong>{result.cbtIncorrectCount || 0}</strong>
                        </div>
                        <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                          Kosong: <strong>{result.cbtUnansweredCount || 0}</strong>
                        </div>
                      </div>
                    )}

                    {!isCbt && ass && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 italic">
                        &quot;{ass.notes}&quot; — <span className="font-semibold text-slate-700">{ass.examinerName}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-[#0f2b5c] text-white hover:bg-[#153a7a] rounded-xl"
            >
              Tutup Rekapitulasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
