import React, { useState } from 'react';
import {
  X,
  Layers,
  Save,
  AlertCircle,
  Hash,
  Award,
} from 'lucide-react';
import { TestCategory, TestCategoryType } from '../../types/ppdb';
import { saveTestCategory } from '../../services/ppdbService';

interface CategoryModalProps {
  category?: TestCategory | null;
  onClose: () => void;
  onSaved: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  category,
  onClose,
  onSaved,
}) => {
  const isEdit = Boolean(category);

  const [code, setCode] = useState(category?.code || '');
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [type, setType] = useState<TestCategoryType>(category?.type || 'cbt');
  const [passingGrade, setPassingGrade] = useState<number>(category?.passingGrade || 75);
  const [weight, setWeight] = useState<number>(category?.weight || 20);
  const [order, setOrder] = useState<number>(category?.order || 1);
  const [isActive, setIsActive] = useState<boolean>(category?.isActive !== false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !name.trim()) {
      setError('Kode dan Nama Kategori wajib diisi.');
      return;
    }

    if (weight < 0 || weight > 100) {
      setError('Bobot harus antara 0% hingga 100%.');
      return;
    }

    setSubmitting(true);
    try {
      await saveTestCategory({
        id: category?.id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        type,
        passingGrade: Number(passingGrade),
        weight: Number(weight),
        order: Number(order),
        isActive,
      });

      setSubmitting(false);
      onSaved();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Gagal menyimpan kategori tes.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Layers className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEdit ? 'Ubah Kategori Ujian' : 'Tambah Kategori Ujian Baru'}
              </h3>
              <p className="text-xs text-slate-300">
                Pondok Pesantren Al Ikhlas &bull; Struktur Bobot & KKM
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kode Unik Kategori *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: AKADEMIK / QURAN"
                className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipe Penilaian *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TestCategoryType)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-medium text-slate-700"
              >
                <option value="cbt">CBT (Ujian Komputer Online)</option>
                <option value="examiner">Penilaian Asatidz (Tahfidz/Quran)</option>
                <option value="interview">Wawancara (Santri & Wali)</option>
                <option value="practical">Praktik (Ibadah & Shalat)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Kategori Tes *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Tes Akademik / Tes Hafalan"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Deskripsi Materi Ujian
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rincian materi yang diujikan..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bobot Nilai (%) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-bold text-[#0f2b5c]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Passing Grade (KKM 0-100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={passingGrade}
                onChange={(e) => setPassingGrade(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Urutan Sesi (Order)
              </label>
              <input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#0f2b5c] rounded-md border-slate-300 focus:ring-[#0f2b5c]"
                />
                <span>Kategori Aktif Diujikan</span>
              </label>
            </div>
          </div>

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
              {submitting ? 'Menyimpan...' : 'Simpan Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
