import React, { useState } from 'react';
import {
  X,
  Eye,
  CheckCircle2,
  HelpCircle,
  Award,
  Lock,
} from 'lucide-react';
import { QuestionBank } from '../../types/ppdb';

interface QuestionPreviewModalProps {
  question: QuestionBank;
  onClose: () => void;
}

export const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
  question,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [shortAnswerInput, setShortAnswerInput] = useState<string>('');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5 text-amber-300" />
            <h3 className="text-base font-bold text-white">
              Pratinjau Soal Ujian (Tampilan Santri)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Top metadata tags */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {question.categoryName || question.categoryId}
            </span>
            <span className="font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Bobot: {question.points} Poin
            </span>
          </div>

          {/* Question Body */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {question.questionText}
            </p>

            {question.imageUrl && (
              <div className="pt-2">
                <img
                  src={question.imageUrl}
                  alt="Ilustrasi Soal"
                  className="max-h-48 rounded-xl object-contain border border-slate-200 mx-auto"
                />
              </div>
            )}
          </div>

          {/* Answer choices simulation */}
          {question.questionType === 'multiple_choice' && question.options && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pilih Jawaban Anda:
              </span>
              {question.options.map((opt, idx) => {
                const label = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
                const isSelected = selectedOption === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-[#0f2b5c] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {label}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {question.questionType === 'true_false' && question.options && (
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedOption(idx)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#0f2b5c] text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {question.questionType === 'short_answer' && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Ketikkan Jawaban Singkat:
              </span>
              <input
                type="text"
                value={shortAnswerInput}
                onChange={(e) => setShortAnswerInput(e.target.value)}
                placeholder="Jawaban santri di sini..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>
          )}

          {/* Admin Answer Key & Explanation Inspector Panel */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Kunci Jawaban Resmi (Hanya Terlihat oleh Admin & Penguji):</span>
            </div>

            <div className="p-2 bg-white rounded-xl border border-amber-200 font-semibold text-emerald-800">
              {question.questionType === 'short_answer' ? (
                <span>Kunci Jawaban: {question.correctAnswerText || '-'}</span>
              ) : (
                <span>
                  Kunci Jawaban:{' '}
                  {['A', 'B', 'C', 'D'][question.correctOptionIndex ?? 0]}.{' '}
                  {question.options?.[question.correctOptionIndex ?? 0] || '-'}
                </span>
              )}
            </div>

            {question.explanation && (
              <p className="text-[11px] text-slate-600 italic">
                Pembahasan: {question.explanation}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-[#0f2b5c] text-white hover:bg-[#153a7a] rounded-xl"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
