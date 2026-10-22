import React, { useState } from 'react';
import {
  X,
  Award,
  User,
  GraduationCap,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Sliders,
} from 'lucide-react';
import { Applicant } from '../../types/ppdb';
import { submitExaminerAssessment } from '../../services/ppdbService';
import { useAuth } from '../../contexts/AuthContext';

interface AssessmentModalProps {
  applicant: Applicant;
  onClose: () => void;
  onSaved: () => void;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  applicant,
  onClose,
  onSaved,
}) => {
  const { userProfile } = useAuth();

  const [tahfidzKelancaran, setTahfidzKelancaran] = useState<number>(80);
  const [tahfidzTajwid, setTahfidzTajwid] = useState<number>(75);
  const [tahfidzMakharij, setTahfidzMakharij] = useState<number>(75);
  const [adabAkhlak, setAdabAkhlak] = useState<number>(85);
  const [bahasaPemahaman, setBahasaPemahaman] = useState<number>(70);
  const [komitmenSantri, setKomitmenSantri] = useState<number>(85);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate weighted or average total
  const totalScore = Math.round(
    (tahfidzKelancaran + tahfidzTajwid + tahfidzMakharij + adabAkhlak + bahasaPemahaman + komitmenSantri) / 6
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await submitExaminerAssessment({
        applicantId: applicant.id,
        applicantName: applicant.fullName,
        registrationNumber: applicant.registrationNumber,
        examinerId: userProfile?.uid || 'examiner-uid',
        examinerName: userProfile?.displayName || 'Ustadz Penguji',
        categoryId: 'TAHFIDZ',
        categoryName: 'Tahfidz Al-Qur\'an & Wawancara',
        aspectScores: {
          tahfidz_kelancaran: tahfidzKelancaran,
          tahfidz_tajwid: tahfidzTajwid,
          tahfidz_makharij: tahfidzMakharij,
          adab_akhlak: adabAkhlak,
          bahasa_pemahaman: bahasaPemahaman,
          komitmen_santri: komitmenSantri,
        },
        totalScore,
        isDraft: false,
        notes: notes || 'Calon santri menunjukkan adab yang baik dan potensi hafalan yang memadai.',
      });

      setSubmitting(false);
      onSaved();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Gagal menyimpan penilaian');
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
                Lembar Penilaian Penguji
              </h3>
              <p className="text-xs text-slate-300">
                Pondok Pesantren Al Ikhlas &bull; Seleksi Masuk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Applicant Summary Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0f2b5c] text-amber-300 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{applicant.fullName}</div>
              <div className="text-slate-500 flex items-center gap-2">
                <span>No. Reg: <strong className="text-amber-700">{applicant.registrationNumber}</strong></span>
                <span>&bull;</span>
                <span>Asal: {applicant.previousSchool}</span>
              </div>
            </div>
          </div>
          <div className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full border border-amber-300">
            {applicant.program}
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Scoring Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-amber-600" />
              Rubrik Penilaian Aspek (Skala 0 - 100)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Nilai Akhir Rata-rata:</span>
              <span className={`text-base font-extrabold px-2.5 py-0.5 rounded-lg ${
                totalScore >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {totalScore} / 100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kelancaran Tahfidz */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>1. Kelancaran Hafalan (Tahfidz)</span>
                <span className="font-bold text-[#0f2b5c]">{tahfidzKelancaran}</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={tahfidzKelancaran}
                onChange={(e) => setTahfidzKelancaran(Number(e.target.value))}
                className="w-full accent-[#0f2b5c]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Tersendat (40)</span>
                <span>Lancar Mumtaz (100)</span>
              </div>
            </div>

            {/* Tajwid & Tartil */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>2. Tajwid & Tartil Tilawah</span>
                <span className="font-bold text-[#0f2b5c]">{tahfidzTajwid}</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={tahfidzTajwid}
                onChange={(e) => setTahfidzTajwid(Number(e.target.value))}
                className="w-full accent-[#0f2b5c]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Kurang Pas (40)</span>
                <span>Sangat Tartil (100)</span>
              </div>
            </div>

            {/* Makharijul Huruf */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>3. Fashahah & Makharij</span>
                <span className="font-bold text-[#0f2b5c]">{tahfidzMakharij}</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={tahfidzMakharij}
                onChange={(e) => setTahfidzMakharij(Number(e.target.value))}
                className="w-full accent-[#0f2b5c]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Cadel/Kaku (40)</span>
                <span>Fasih (100)</span>
              </div>
            </div>

            {/* Adab & Akhlak Santri */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>4. Adab, Sopan Santun & Akhlak</span>
                <span className="font-bold text-[#0f2b5c]">{adabAkhlak}</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={adabAkhlak}
                onChange={(e) => setAdabAkhlak(Number(e.target.value))}
                className="w-full accent-[#0f2b5c]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Cukup (40)</span>
                <span>Sangat Beradab (100)</span>
              </div>
            </div>

            {/* Dasar Bahasa Arab / Agama */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>5. Pengetahuan Agama & Bahasa</span>
                <span className="font-bold text-[#0f2b5c]">{bahasaPemahaman}</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={bahasaPemahaman}
                onChange={(e) => setBahasaPemahaman(Number(e.target.value))}
                className="w-full accent-[#0f2b5c]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Dasar (40)</span>
                <span>Mahir (100)</span>
              </div>
            </div>

            {/* Komitmen & Kesiapan Berasrama */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>6. Kesiapan Mondok & Mandiri</span>
                <span className="font-bold text-[#0f2b5c]">{komitmenSantri}</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={komitmenSantri}
                onChange={(e) => setKomitmenSantri(Number(e.target.value))}
                className="w-full accent-[#0f2b5c]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Ragu-ragu (40)</span>
                <span>Sangat Siap (100)</span>
              </div>
            </div>
          </div>

          {/* Examiner Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Catatan Rekomendasi Penguji / Ustadz
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Bacaan surat An-Naba sangat baik, memiliki motivasi tinggi menghafal 30 juz, wali santri mendukung penuh kedisiplinan pondok."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#0f2b5c] hover:bg-[#153a7a] rounded-xl shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-amber-300" />
              {submitting ? 'Menyimpan...' : 'Simpan Penilaian Penguji'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
