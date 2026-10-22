import React, { useState } from 'react';
import {
  X,
  Settings,
  Globe,
  Lock,
  Eye,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { AnnouncementConfig } from '../../../types/ppdb';
import { saveAnnouncementConfig } from '../../../services/ppdbService';
import { useAuth } from '../../../contexts/AuthContext';

interface AnnouncementSettingsModalProps {
  config: AnnouncementConfig;
  onClose: () => void;
  onSaved: (updated: AnnouncementConfig) => void;
}

export const AnnouncementSettingsModal: React.FC<AnnouncementSettingsModalProps> = ({
  config,
  onClose,
  onSaved,
}) => {
  const { userProfile } = useAuth();
  const [isPublished, setIsPublished] = useState(config.isPublished);
  const [publishDate, setPublishDate] = useState(
    config.publishDate ? config.publishDate.slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(config.showCategoryBreakdown ?? true);
  const [showExaminerNotes, setShowExaminerNotes] = useState(config.showExaminerNotes ?? false);
  const [publicNotice, setPublicNotice] = useState(config.publicNotice || '');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await saveAnnouncementConfig(
        {
          isPublished,
          publishDate: new Date(publishDate).toISOString(),
          showCategoryBreakdown,
          showExaminerNotes,
          publicNotice,
        },
        userProfile?.displayName || userProfile?.email || 'admin'
      );
      setSuccess(true);
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pengaturan publikasi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Pengaturan Publikasi Hasil Seleksi (PPDB)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Pengaturan berhasil disimpan!</span>
            </div>
          )}

          {/* Master Toggle: Publish vs Hide */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Status Pengumuman Kelulusan
                </span>
                <span className="text-[11px] text-slate-500">
                  {isPublished
                    ? 'Hasil kelulusan terbuka dan dapat dilihat oleh calon santri'
                    : 'Hasil kelulusan disembunyikan (Santri hanya melihat jadwal/status persiapan)'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                  isPublished
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {isPublished ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isPublished ? 'Dipublikasikan' : 'Disembunyikan'}</span>
              </button>
            </div>
          </div>

          {/* Scheduled Publication Date */}
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
              Jadwal Tanggal & Waktu Rilis Pengumuman
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="datetime-local"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-800"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Jika waktu rilis belum tercapai, santri akan melihat countdown jadwal rilis resmi.
            </p>
          </div>

          {/* Visibility Controls for Candidates */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              Opsi Informasi yang Boleh Dilihat Santri
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={showCategoryBreakdown}
                onChange={(e) => setShowCategoryBreakdown(e.target.checked)}
                className="mt-0.5 rounded text-[#0f2b5c] focus:ring-[#0f2b5c]"
              />
              <div>
                <span className="font-bold text-slate-900 block">Tampilkan Rincian Nilai per Kategori</span>
                <span className="text-[10px] text-slate-500 leading-relaxed">
                  Santri dapat melihat capaian nilai Tes Akademik, Baca Al-Qur&apos;an, Tahfidz, Wawancara, dan Praktik secara transparan.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={showExaminerNotes}
                onChange={(e) => setShowExaminerNotes(e.target.checked)}
                className="mt-0.5 rounded text-[#0f2b5c] focus:ring-[#0f2b5c]"
              />
              <div>
                <span className="font-bold text-slate-900 block">Tampilkan Catatan Kualitatif Asatidz</span>
                <span className="text-[10px] text-slate-500 leading-relaxed">
                  Izinkan santri membaca masukan dan evaluasi lisan dari penguji (biarkan nonaktif jika bersifat rahasia pleno).
                </span>
              </div>
            </label>
          </div>

          {/* Public Official Letter Notice */}
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
              Mukadimah / Teks Resmi Pengumuman
            </label>
            <textarea
              rows={3}
              value={publicNotice}
              onChange={(e) => setPublicNotice(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              placeholder="Teks surat keputusan yang tampil di beranda santri..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5 text-amber-300" />
              <span>{saving ? 'Menyimpan...' : 'Terapkan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
