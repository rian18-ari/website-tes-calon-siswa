import React, { useState } from 'react';
import {
  X,
  Award,
  BookOpen,
  User,
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Applicant, ExaminerAssessment, TestCategory } from '../../types/ppdb';
import { submitExaminerAssessment, recalculateApplicantResult } from '../../services/ppdbService';
import { useAuth } from '../../contexts/AuthContext';

interface ManualAssessmentModalProps {
  applicant: Applicant;
  categories: TestCategory[];
  initialCategoryId?: string;
  existingAssessment?: ExaminerAssessment | null;
  onClose: () => void;
  onSaved: () => void;
}

export const ManualAssessmentModal: React.FC<ManualAssessmentModalProps> = ({
  applicant,
  categories,
  initialCategoryId,
  existingAssessment,
  onClose,
  onSaved,
}) => {
  const { userProfile } = useAuth();

  // Filter only manual examiner categories: QURAN, HAFALAN, WAWANCARA, PRAKTIK
  const manualCategories = categories.filter((c) => c.type !== 'cbt');

  const [selectedCatCode, setSelectedCatCode] = useState<string>(
    initialCategoryId || existingAssessment?.categoryId || (manualCategories[0]?.code || 'HAFALAN')
  );

  // Criteria scores per category
  // 1. QURAN
  const [quranTajwid, setQuranTajwid] = useState<number>(existingAssessment?.aspectScores.quran_tajwid || 80);
  const [quranMakharij, setQuranMakharij] = useState<number>(existingAssessment?.aspectScores.quran_makharij || 75);
  const [quranKelancaran, setQuranKelancaran] = useState<number>(existingAssessment?.aspectScores.quran_kelancaran || 80);

  // 2. HAFALAN
  const [hafalanKelancaran, setHafalanKelancaran] = useState<number>(existingAssessment?.aspectScores.hafalan_kelancaran || 80);
  const [hafalanTajwid, setHafalanTajwid] = useState<number>(existingAssessment?.aspectScores.hafalan_tajwid || 75);
  const [hafalanMakharij, setHafalanMakharij] = useState<number>(existingAssessment?.aspectScores.hafalan_makharij || 75);
  const [hafalanSambungAyat, setHafalanSambungAyat] = useState<number>(existingAssessment?.aspectScores.hafalan_sambung_ayat || 80);

  // 3. WAWANCARA
  const [wawancaraAdab, setWawancaraAdab] = useState<number>(existingAssessment?.aspectScores.wawancara_adab || 85);
  const [wawancaraKemandirian, setWawancaraKemandirian] = useState<number>(existingAssessment?.aspectScores.wawancara_kemandirian || 80);
  const [wawancaraKomitmenWali, setWawancaraKomitmenWali] = useState<number>(existingAssessment?.aspectScores.wawancara_komitmen_wali || 85);

  // 4. PRAKTIK
  const [praktikWudhu, setPraktikWudhu] = useState<number>(existingAssessment?.aspectScores.praktik_wudhu || 80);
  const [praktikShalat, setPraktikShalat] = useState<number>(existingAssessment?.aspectScores.praktik_shalat || 80);
  const [praktikDoa, setPraktikDoa] = useState<number>(existingAssessment?.aspectScores.praktik_doa || 75);

  const [notes, setNotes] = useState<string>(existingAssessment?.notes || '');
  const [isDraft, setIsDraft] = useState<boolean>(existingAssessment?.isDraft || false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Compute total score dynamically depending on active category
  let calculatedScore = 80;
  if (selectedCatCode === 'QURAN') {
    calculatedScore = Math.round((quranTajwid + quranMakharij + quranKelancaran) / 3);
  } else if (selectedCatCode === 'HAFALAN') {
    calculatedScore = Math.round((hafalanKelancaran + hafalanTajwid + hafalanMakharij + hafalanSambungAyat) / 4);
  } else if (selectedCatCode === 'WAWANCARA') {
    calculatedScore = Math.round((wawancaraAdab + wawancaraKemandirian + wawancaraKomitmenWali) / 3);
  } else if (selectedCatCode === 'PRAKTIK') {
    calculatedScore = Math.round((praktikWudhu + praktikShalat + praktikDoa) / 3);
  }

  const selectedCategoryObj = categories.find((c) => c.code === selectedCatCode || c.id === selectedCatCode);

  const handleSubmit = async (draftMode: boolean) => {
    setSubmitting(true);
    setError(null);

    const aspectScores: any = {};
    if (selectedCatCode === 'QURAN') {
      aspectScores.quran_tajwid = quranTajwid;
      aspectScores.quran_makharij = quranMakharij;
      aspectScores.quran_kelancaran = quranKelancaran;
    } else if (selectedCatCode === 'HAFALAN') {
      aspectScores.hafalan_kelancaran = hafalanKelancaran;
      aspectScores.hafalan_tajwid = hafalanTajwid;
      aspectScores.hafalan_makharij = hafalanMakharij;
      aspectScores.hafalan_sambung_ayat = hafalanSambungAyat;
    } else if (selectedCatCode === 'WAWANCARA') {
      aspectScores.wawancara_adab = wawancaraAdab;
      aspectScores.wawancara_kemandirian = wawancaraKemandirian;
      aspectScores.wawancara_komitmen_wali = wawancaraKomitmenWali;
    } else if (selectedCatCode === 'PRAKTIK') {
      aspectScores.praktik_wudhu = praktikWudhu;
      aspectScores.praktik_shalat = praktikShalat;
      aspectScores.praktik_doa = praktikDoa;
    }

    try {
      await submitExaminerAssessment({
        applicantId: applicant.id,
        applicantName: applicant.fullName,
        registrationNumber: applicant.registrationNumber,
        examinerId: userProfile?.uid || 'examiner-uid',
        examinerName: userProfile?.displayName || 'Ustadz Penguji',
        categoryId: selectedCatCode,
        categoryName: selectedCategoryObj?.name || selectedCatCode,
        aspectScores,
        totalScore: calculatedScore,
        notes: notes || `Penilaian untuk ${selectedCategoryObj?.name || selectedCatCode} telah disahkan oleh penguji.`,
        isDraft: draftMode,
      });

      // Recalculate applicant multi-category result
      await recalculateApplicantResult(applicant.id);

      setSubmitting(false);
      onSaved();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Gagal menyimpan penilaian penguji.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Lembar Penilaian Ustadz Penguji
              </h3>
              <p className="text-xs text-slate-300">
                Pondok Pesantren Al Ikhlas &bull; Evaluasi Lisan & Praktik
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

        {/* Applicant Summary */}
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
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Penguji:</span>
            <span className="font-bold text-slate-800">{userProfile?.displayName || 'Ustadz Penguji'}</span>
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Category Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Kategori Ujian yang Dinilai:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { code: 'QURAN', name: 'Baca Al-Qur\'an' },
                { code: 'HAFALAN', name: 'Hafalan Tahfidz' },
                { code: 'WAWANCARA', name: 'Wawancara' },
                { code: 'PRAKTIK', name: 'Praktik Ibadah' },
              ].map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCatCode(c.code)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedCatCode === c.code
                      ? 'bg-[#0f2b5c] text-white border-[#0f2b5c] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Current Rubric Score Badge */}
          <div className="flex items-center justify-between p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200">
            <div>
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                Rubrik Penilaian {selectedCategoryObj?.name || selectedCatCode}
              </span>
              <span className="text-[11px] text-amber-800">
                Passing Grade (KKM): {selectedCategoryObj?.passingGrade || 75}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Skor Akhir Kategori</span>
              <span className={`text-xl font-black ${
                calculatedScore >= (selectedCategoryObj?.passingGrade || 75)
                  ? 'text-emerald-700'
                  : 'text-amber-800'
              }`}>
                {calculatedScore} / 100
              </span>
            </div>
          </div>

          {/* 1. BACA AL-QURAN RUBRIC */}
          {selectedCatCode === 'QURAN' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>1. Kaidah Ilmu Tajwid (Nun/Mim Sukun, Mad, Idgham, Ikhfa)</span>
                  <span className="font-bold text-[#0f2b5c]">{quranTajwid}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={quranTajwid}
                  onChange={(e) => setQuranTajwid(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>2. Makharijul Huruf & Fashahah (Kefasihan Ucapan Huruf Hijaiyah)</span>
                  <span className="font-bold text-[#0f2b5c]">{quranMakharij}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={quranMakharij}
                  onChange={(e) => setQuranMakharij(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>3. Kelancaran Membaca & Irama Tartil (Waqaf & Ibtida)</span>
                  <span className="font-bold text-[#0f2b5c]">{quranKelancaran}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={quranKelancaran}
                  onChange={(e) => setQuranKelancaran(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>
            </div>
          )}

          {/* 2. HAFALAN TAHFIDZ RUBRIC */}
          {selectedCatCode === 'HAFALAN' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>1. Kelancaran Hafalan Juz 30 (Tanpa Terbata-bata)</span>
                  <span className="font-bold text-[#0f2b5c]">{hafalanKelancaran}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={hafalanKelancaran}
                  onChange={(e) => setHafalanKelancaran(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>2. Ketepatan Sambung Ayat (Tebakan Potongan Ayat Ustadz)</span>
                  <span className="font-bold text-[#0f2b5c]">{hafalanSambungAyat}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={hafalanSambungAyat}
                  onChange={(e) => setHafalanSambungAyat(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>3. Tajwid & Tartil Hafalan</span>
                  <span className="font-bold text-[#0f2b5c]">{hafalanTajwid}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={hafalanTajwid}
                  onChange={(e) => setHafalanTajwid(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>
            </div>
          )}

          {/* 3. WAWANCARA RUBRIC */}
          {selectedCatCode === 'WAWANCARA' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>1. Adab, Sopan Santun & Akhlak Santri</span>
                  <span className="font-bold text-[#0f2b5c]">{wawancaraAdab}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={wawancaraAdab}
                  onChange={(e) => setWawancaraAdab(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>2. Motivasi & Kemandirian Berasrama (Tanpa Gadget/Orang Tua)</span>
                  <span className="font-bold text-[#0f2b5c]">{wawancaraKemandirian}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={wawancaraKemandirian}
                  onChange={(e) => setWawancaraKemandirian(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>3. Komitmen Wali Santri Mendukung Ketertiban Pesantren</span>
                  <span className="font-bold text-[#0f2b5c]">{wawancaraKomitmenWali}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={wawancaraKomitmenWali}
                  onChange={(e) => setWawancaraKomitmenWali(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>
            </div>
          )}

          {/* 4. PRAKTIK IBADAH RUBRIC */}
          {selectedCatCode === 'PRAKTIK' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>1. Praktik & Rukun Wudhu yang Benar</span>
                  <span className="font-bold text-[#0f2b5c]">{praktikWudhu}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={praktikWudhu}
                  onChange={(e) => setPraktikWudhu(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>2. Gerakan & Bacaan Shalat Fardhu (Tuma&apos;ninah & Tahiyyat)</span>
                  <span className="font-bold text-[#0f2b5c]">{praktikShalat}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={praktikShalat}
                  onChange={(e) => setPraktikShalat(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>3. Hafalan Doa Harian & Dzikir Ba&apos;da Shalat</span>
                  <span className="font-bold text-[#0f2b5c]">{praktikDoa}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={praktikDoa}
                  onChange={(e) => setPraktikDoa(Number(e.target.value))}
                  className="w-full accent-[#0f2b5c]"
                />
              </div>
            </div>
          )}

          {/* Examiner Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Catatan & Rekomendasi Khusus Ustadz Penguji
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Bacaan surat An-Naba sangat baik, memiliki motivasi tinggi menghafal 30 juz, wali santri mendukung penuh kedisiplinan pondok."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
            />
          </div>

          {/* Action Buttons: Save as Draft vs Finalize */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors"
              >
                Simpan Sebagai Draft
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#0f2b5c] hover:bg-[#153a7a] rounded-xl shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-amber-300" />
                {submitting ? 'Menyimpan...' : 'Sahkan Penilaian Final'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
