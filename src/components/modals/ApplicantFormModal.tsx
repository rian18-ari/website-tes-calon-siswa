import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  Save,
  AlertCircle,
  School,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Shield,
} from 'lucide-react';
import { Applicant, ApplicantStatus } from '../../types/ppdb';
import { createApplicant, updateApplicant } from '../../services/ppdbService';

interface ApplicantFormModalProps {
  applicant?: Applicant | null; // null for Create, populated for Edit
  onClose: () => void;
  onSaved: () => void;
}

export const ApplicantFormModal: React.FC<ApplicantFormModalProps> = ({
  applicant,
  onClose,
  onSaved,
}) => {
  const isEdit = Boolean(applicant);

  const [fullName, setFullName] = useState(applicant?.fullName || '');
  const [nisn, setNisn] = useState(applicant?.nisn || '');
  const [gender, setGender] = useState<'L' | 'P'>(applicant?.gender || 'L');
  const [program, setProgram] = useState(applicant?.program || 'Kulliyyatul Mu\'allimin (KMI)');
  const [birthPlace, setBirthPlace] = useState(applicant?.birthPlace || 'Bandung');
  const [birthDate, setBirthDate] = useState(applicant?.birthDate || '2012-05-10');
  const [previousSchool, setPreviousSchool] = useState(applicant?.previousSchool || '');
  const [parentName, setParentName] = useState(applicant?.parentName || '');
  const [parentPhone, setParentPhone] = useState(applicant?.parentPhone || '');
  const [address, setAddress] = useState(applicant?.address || '');
  const [wave, setWave] = useState(applicant?.wave || 'Gelombang 1');
  const [status, setStatus] = useState<ApplicantStatus>(applicant?.status || 'registered');
  const [isActive, setIsActive] = useState<boolean>(applicant?.isActive !== false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !nisn.trim()) {
      setError('Nama Lengkap dan NISN wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && applicant) {
        await updateApplicant(applicant.id, {
          fullName: fullName.trim(),
          nisn: nisn.trim(),
          gender,
          program,
          birthPlace: birthPlace.trim(),
          birthDate,
          previousSchool: previousSchool.trim() || 'SD/MI Asal',
          parentName: parentName.trim() || 'Orang Tua / Wali',
          parentPhone: parentPhone.trim() || '-',
          address: address.trim() || 'Alamat tempat tinggal',
          wave,
          status,
          isActive,
        });
      } else {
        const randomNum = Math.floor(100 + Math.random() * 900);
        const regNumber = `PPDB-2026-${randomNum}`;

        await createApplicant({
          userId: `manual-entry-${Date.now()}`,
          registrationNumber: regNumber,
          fullName: fullName.trim(),
          nisn: nisn.trim(),
          gender,
          program,
          birthPlace: birthPlace.trim() || 'Kota',
          birthDate: birthDate || '2012-01-01',
          previousSchool: previousSchool.trim() || 'SD/MI Asal',
          parentName: parentName.trim() || 'Orang Tua / Wali',
          parentPhone: parentPhone.trim() || '-',
          address: address.trim() || 'Alamat tempat tinggal santri',
          wave,
          status,
          isActive,
        });
      }

      setSubmitting(false);
      onSaved();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Gagal menyimpan data calon santri.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <User className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEdit ? 'Ubah Data Calon Santri' : 'Tambah Calon Santri Baru'}
              </h3>
              <p className="text-xs text-slate-300">
                Pondok Pesantren Al Ikhlas &bull; Manajemen Peserta PPDB
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

        {error && (
          <div className="m-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap Calon Santri *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Muhammad Azzam Fathoni"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                NISN (10 Digit) *
              </label>
              <input
                type="text"
                required
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                placeholder="Contoh: 0098765432"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jenis Kelamin *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-medium text-slate-700"
              >
                <option value="L">Laki-laki (Ikhwan)</option>
                <option value="P">Perempuan (Akhwat)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pilihan Jenjang / Program *
              </label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-medium text-slate-700"
              >
                <option value="Kulliyyatul Mu'allimin (KMI)">Kulliyyatul Mu&apos;allimin (KMI 6 Tahun)</option>
                <option value="Tahfidz Reguler">Tahfidz Al-Qur&apos;an Reguler</option>
                <option value="Madrasah Tsanawiyah Unggulan">Madrasah Tsanawiyah Unggulan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Gelombang Pendaftaran
              </label>
              <select
                value={wave}
                onChange={(e) => setWave(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-medium text-slate-700"
              >
                <option value="Gelombang 1">Gelombang 1</option>
                <option value="Gelombang 2">Gelombang 2</option>
                <option value="Gelombang Khusus">Gelombang Khusus Prestasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="Kota Kelahiran"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none text-slate-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Asal Sekolah Sebelumnya
              </label>
              <input
                type="text"
                value={previousSchool}
                onChange={(e) => setPreviousSchool(e.target.value)}
                placeholder="Contoh: SDIT Al-Uswah / MI Al-Hikmah"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Orang Tua / Wali
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Nama Ayah/Ibu/Wali"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                No. HP / WhatsApp Orang Tua
              </label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Alamat Tempat Tinggal
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Alamat lengkap calon santri..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            {/* Status & Active state */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status Seleksi PPDB
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicantStatus)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-700"
              >
                <option value="registered">Terdaftar (Menunggu Verifikasi)</option>
                <option value="verified">Terverifikasi (Siap Ujian)</option>
                <option value="testing">Sedang Mengikuti Ujian</option>
                <option value="tested">Sudah Selesai Tes</option>
                <option value="announced">Hasil Diumumkan</option>
                <option value="archived">Diarsipkan / Nonaktif</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="relative flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#0f2b5c] rounded-md border-slate-300 focus:ring-[#0f2b5c]"
                />
                <span>Data Peserta Aktif (Dapat Mengikuti Tes)</span>
              </label>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
              {submitting ? 'Menyimpan...' : isEdit ? 'Perbarui Data Santri' : 'Simpan Calon Santri'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
