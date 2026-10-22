import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  Save,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle,
  Plus,
  Trash2,
  FileQuestion,
} from 'lucide-react';
import { QuestionBank, QuestionType, TestCategory } from '../../types/ppdb';
import { saveQuestion } from '../../services/ppdbService';

interface QuestionModalProps {
  question?: QuestionBank | null;
  categories: TestCategory[];
  onClose: () => void;
  onSaved: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  categories,
  onClose,
  onSaved,
}) => {
  const isEdit = Boolean(question);

  const [categoryId, setCategoryId] = useState(
    question?.categoryId || (categories.length > 0 ? categories[0].code || categories[0].id : 'AKADEMIK')
  );
  const [questionType, setQuestionType] = useState<QuestionType>(question?.questionType || 'multiple_choice');
  const [questionText, setQuestionText] = useState(question?.questionText || '');
  const [imageUrl, setImageUrl] = useState(question?.imageUrl || '');
  const [points, setPoints] = useState<number>(question?.points || 10);
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [isActive, setIsActive] = useState<boolean>(question?.isActive !== false);

  // Options for multiple choice or true/false
  const defaultMcOptions = question?.options && question.options.length >= 4
    ? question.options
    : ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'];

  const [options, setOptions] = useState<string[]>(
    question?.options || (questionType === 'true_false' ? ['Benar', 'Salah'] : defaultMcOptions)
  );

  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(question?.correctOptionIndex ?? 0);
  const [correctAnswerText, setCorrectAnswerText] = useState<string>(question?.correctAnswerText || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    if (newType === 'true_false') {
      setOptions(['Benar', 'Salah']);
      setCorrectOptionIndex(0);
    } else if (newType === 'multiple_choice') {
      setOptions(['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D']);
      setCorrectOptionIndex(0);
    }
  };

  const handleOptionTextChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!questionText.trim()) {
      setError('Teks soal / pertanyaan tidak boleh kosong.');
      return;
    }

    if (questionType === 'short_answer' && !correctAnswerText.trim()) {
      setError('Kunci jawaban isian singkat harus diisi.');
      return;
    }

    const selectedCat = categories.find((c) => c.code === categoryId || c.id === categoryId);

    setSubmitting(true);
    try {
      await saveQuestion({
        id: question?.id,
        categoryId,
        categoryName: selectedCat?.name || categoryId,
        questionText: questionText.trim(),
        imageUrl: imageUrl.trim() || undefined,
        questionType,
        options: questionType !== 'short_answer' ? options : undefined,
        correctOptionIndex: questionType !== 'short_answer' ? correctOptionIndex : undefined,
        correctAnswerText: questionType === 'short_answer' ? correctAnswerText.trim() : undefined,
        points: Number(points) || 10,
        explanation: explanation.trim() || undefined,
        isActive,
      });

      setSubmitting(false);
      onSaved();
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'Gagal menyimpan butir soal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <FileQuestion className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEdit ? 'Ubah Soal Ujian' : 'Tambah Soal ke Bank Soal'}
              </h3>
              <p className="text-xs text-slate-300">
                Pondok Pesantren Al Ikhlas &bull; Manajemen Bank Soal PPDB
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Category & Question Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kategori Tes *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-800"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.code || c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jenis Soal *
              </label>
              <select
                value={questionType}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-slate-800"
              >
                <option value="multiple_choice">Pilihan Ganda (PG)</option>
                <option value="true_false">Benar / Salah</option>
                <option value="short_answer">Isian Singkat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bobot Poin Soal *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-bold text-[#0f2b5c]"
              />
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Teks Pertanyaan / Soal *
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Tuliskan butir soal di sini (mendukung teks Arab dan Indonesia)..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
            />
          </div>

          {/* Optional Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              URL Gambar Pendukung (Opsional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/gambar-soal.png"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
            />
            {imageUrl && (
              <div className="mt-2 p-2 bg-slate-100 rounded-xl border border-slate-200 inline-block">
                <span className="text-[10px] text-slate-500 block mb-1">Pratinjau Gambar:</span>
                <img
                  src={imageUrl}
                  alt="Preview Soal"
                  className="max-h-32 rounded-lg object-contain"
                  onError={() => setError('URL Gambar tidak dapat dimuat atau tidak valid.')}
                />
              </div>
            )}
          </div>

          {/* Options & Answer Key */}
          {questionType === 'multiple_choice' && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pilihan Jawaban & Tandai Kunci Jawaban Benar:
              </label>
              {options.map((opt, idx) => {
                const label = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
                const isSelected = correctOptionIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <label className="flex items-center cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={isSelected}
                        onChange={() => setCorrectOptionIndex(idx)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-xs text-[#0f2b5c] w-5">{label}.</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      placeholder={`Pilihan ${label}`}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0f2b5c] outline-none"
                    />
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Kunci Jawaban
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {questionType === 'true_false' && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tentukan Kunci Jawaban:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Benar', 'Salah'].map((val, idx) => (
                  <label
                    key={val}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-xs transition-all ${
                      correctOptionIndex === idx
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tfOption"
                      checked={correctOptionIndex === idx}
                      onChange={() => setCorrectOptionIndex(idx)}
                      className="hidden"
                    />
                    <span>{val} (Kunci Jawaban)</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {questionType === 'short_answer' && (
            <div className="space-y-1 pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kunci Jawaban Teks Tepat *
              </label>
              <input
                type="text"
                required
                value={correctAnswerText}
                onChange={(e) => setCorrectAnswerText(e.target.value)}
                placeholder="Contoh: Zakat / 22 Tahun / Mad Thabi'i"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none font-semibold text-emerald-800"
              />
              <span className="text-[10px] text-slate-500">
                Jawaban peserta akan diverifikasi sesuai kunci jawaban ini (case-insensitive).
              </span>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pembahasan / Keterangan Kunci Jawaban
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Penjelasan dalil atau cara penyelesaian soal..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
            />
          </div>

          {/* Active status */}
          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-[#0f2b5c] rounded-md border-slate-300 focus:ring-[#0f2b5c]"
              />
              <span>Soal Aktif (Dapat diikutsertakan dalam sesi ujian peserta)</span>
            </label>
          </div>

          {/* Footer Action */}
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
              {submitting ? 'Menyimpan...' : 'Simpan ke Bank Soal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
