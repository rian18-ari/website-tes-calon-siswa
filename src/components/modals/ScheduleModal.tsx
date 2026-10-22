import React, { useState } from 'react';
import {
  X,
  Calendar,
  Save,
  AlertCircle,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { TestCategory, TestSchedule } from '../../types/ppdb';
import { saveTestSchedule } from '../../services/ppdbService';

interface ScheduleModalProps {
  schedule?: TestSchedule | null;
  categories: TestCategory[];
  onClose: () => void;
  onSaved: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  schedule,
  categories,
  onClose,
  onSaved,
}) => {
  const isEdit = Boolean(schedule);

  const [title, setTitle] = useState(schedule?.title || '');
  const [categoryId, setCategoryId] = useState(schedule?.categoryId || 'all');
  const [examDate, setExamDate] = useState(schedule?.examDate || '2026-11-15');
  const [startTime, setStartTime] = useState(schedule?.startTime || '08:00');
  const [endTime, setEndTime] = useState(schedule?.endTime || '10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(schedule?.durationMinutes || 90);
  const [room, setRoom] = useState(schedule?.room || 'Laboratorium Komputer 1');
  const [quota, setQuota] = useState<number>(schedule?.quota || 40);
  const [wave, setWave] = useState(schedule?.wave || 'Gelombang 1');
  const [targetProgram, setTargetProgram] = useState(schedule?.targetProgram || 'Semua Program');
  const [status, setStatus] = useState<'open' | 'closed' | 'cancelled'>(schedule?.status || 'open');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !examDate || !startTime || !endTime || !room.trim()) {
      setError('Mohon lengkapi seluruh kolom yang bertanda bintang (*).');
      return;
    }

    if (durationMinutes <= 0) {
      setError('Durasi pengerjaan harus lebih besar dari 0 menit.');
      return;
    }

    const selectedCat = categories.find((c) => c.code === categoryId || c.id === categoryId);

    setSubmitting(true);
    try {
      await saveTestSchedule({
        id: schedule?.id,
        title: title.trim(),
        categoryId,
        categoryName: categoryId === 'all' ? 'Semua Kategori (Tes Gabungan)' : selectedCat?.name || categoryId,
        examDate,
        startTime,
        endTime,
        durationMinutes: Number(durationMinutes),
        room: room.trim(),
        quota: Number(quota),
        wave,
        targetProgram,
        status,
      });

      setSubmitting(false);
      onSaved();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Gagal menyimpan jadwal ujian.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Calendar className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEdit ? 'Ubah Jadwal Seleksi' : 'Buat Sesi Jadwal Tes Baru'}
              </h3>
              <p className="text-xs text-slate-300">
                Pondok Pesantren Al Ikhlas &bull; Alokasi Sesi & Ruangan
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

        {error && (
          <div className="m-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama / Judul Sesi Ujian *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Sesi 1 Tes Potensi Akademik & Tahfidz"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kategori Tes Digunakan
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-800"
              >
                <option value="all">Semua Kategori (Tes Terpadu)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.code || c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Gelombang PPDB
              </label>
              <select
                value={wave}
                onChange={(e) => setWave(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-800"
              >
                <option value="Gelombang 1">Gelombang 1</option>
                <option value="Gelombang 2">Gelombang 2</option>
                <option value="Gelombang Khusus">Gelombang Khusus Prestasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Pelaksanaan *
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Durasi Pengerjaan (Menit) *
              </label>
              <input
                type="number"
                min="15"
                max="360"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-bold text-[#0f2b5c]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jam Mulai *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jam Selesai *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ruangan / Lokasi Ujian *
              </label>
              <input
                type="text"
                required
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Lab Komputer 1 / Gedung Tahfidz"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kapasitas Kuota Santri *
              </label>
              <input
                type="number"
                min="1"
                max="500"
                required
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sasaran Program Santri
              </label>
              <select
                value={targetProgram}
                onChange={(e) => setTargetProgram(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-800"
              >
                <option value="Semua Program">Semua Program Santri</option>
                <option value="Kulliyyatul Mu'allimin (KMI)">Kulliyyatul Mu&apos;allimin (KMI)</option>
                <option value="Tahfidz Reguler">Tahfidz Reguler</option>
                <option value="Madrasah Tsanawiyah Unggulan">Madrasah Tsanawiyah Unggulan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status Sesi Jadwal
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'open' | 'closed' | 'cancelled')}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-bold text-slate-800"
              >
                <option value="open">Buka (Terbuka untuk Santri)</option>
                <option value="closed">Tutup (Sesi Selesai/Penuh)</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
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
              {submitting ? 'Menyimpan...' : 'Simpan Jadwal Ujian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
