import React from 'react';
import {
  X,
  User,
  GraduationCap,
  Calendar,
  MapPin,
  Phone,
  School,
  Clock,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { Applicant } from '../../types/ppdb';

interface ApplicantDetailModalProps {
  applicant: Applicant;
  onClose: () => void;
}

export const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({
  applicant,
  onClose,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Terdaftar</span>;
      case 'verified':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">Terverifikasi</span>;
      case 'testing':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Sedang Ujian</span>;
      case 'tested':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">Sudah Tes</span>;
      case 'announced':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Diumumkan</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Biodata Calon Santri
              </h3>
              <p className="text-xs text-slate-300">
                Pondok Pesantren Al Ikhlas
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

        <div className="p-6 space-y-5">
          {/* Top Info */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Nomor Registrasi PPDB
              </span>
              <div className="text-lg font-black text-amber-700 tracking-tight">
                {applicant.registrationNumber}
              </div>
            </div>
            <div>
              {getStatusBadge(applicant.status)}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Nama Lengkap
              </span>
              <span className="font-bold text-slate-800 text-sm">{applicant.fullName}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                NISN / Jenis Kelamin
              </span>
              <span className="font-bold text-slate-800">
                {applicant.nisn} ({applicant.gender === 'L' ? 'Laki-laki / Ikhwan' : 'Perempuan / Akhwat'})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                <School className="w-3.5 h-3.5 text-slate-500" />
                Asal Sekolah
              </span>
              <span className="font-bold text-slate-800">{applicant.previousSchool}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                Pilihan Program
              </span>
              <span className="font-bold text-amber-800">{applicant.program}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Nama Orang Tua / Wali
              </span>
              <span className="font-bold text-slate-800">{applicant.parentName}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                No. HP / WhatsApp
              </span>
              <span className="font-bold text-slate-800">{applicant.parentPhone}</span>
            </div>
          </div>

          {/* Address */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Alamat Lengkap Tempat Tinggal
            </span>
            <span className="text-slate-700">{applicant.address}</span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0f2b5c] text-white hover:bg-[#153a7a]"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
