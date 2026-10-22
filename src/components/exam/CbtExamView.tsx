import React, { useEffect, useState, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  CloudCheck,
  CloudAlert,
  Building2,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { Applicant, QuestionBank, TestAnswer, TestSchedule, TestSession } from '../../types/ppdb';
import {
  saveAnswerAutosave,
  toggleQuestionDoubt,
  getAnswersForSession,
  submitTestSession,
  getSystemGradingConfig,
} from '../../services/ppdbService';

interface CbtExamViewProps {
  applicant: Applicant;
  schedule: TestSchedule;
  session: TestSession;
  questions: QuestionBank[];
  onFinish: () => void;
  onExit: () => void;
}

export const CbtExamView: React.FC<CbtExamViewProps> = ({
  applicant,
  schedule,
  session,
  questions,
  onFinish,
  onExit,
}) => {
  // Test start confirmation
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // Active question index (0 .. questions.length - 1)
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Answers map { [questionId]: TestAnswer }
  const [answers, setAnswers] = useState<Record<string, TestAnswer>>({});

  // Doubt / Marked questions set
  const [doubtSet, setDoubtSet] = useState<Set<string>>(
    new Set(session.markedDoubtQuestionIds || [])
  );

  // Sync / Saving status: 'saved' | 'saving' | 'offline'
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');

  // Time remaining in seconds
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const expiry = new Date(session.expiresAt).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((expiry - now) / 1000));
  });

  // Modal confirm submit
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedResult, setCompletedResult] = useState<any | null>(null);
  const [allowDirectView, setAllowDirectView] = useState<boolean>(false);

  // Load existing answers on mount
  useEffect(() => {
    const fetchExistingAnswers = async () => {
      const existingMap = await getAnswersForSession(session.id);
      setAnswers(existingMap);
    };
    fetchExistingAnswers();

    // Check direct view permission
    getSystemGradingConfig().then((cfg) => {
      setAllowDirectView(Boolean(cfg.allowDirectResultView));
    });
  }, [session.id]);

  // Countdown Timer
  useEffect(() => {
    if (!hasStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit('Waktu ujian telah habis.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeLeft]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Current Question
  const currentQuestion = questions[currentIndex] || questions[0];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCurrentDoubt = currentQuestion ? doubtSet.has(currentQuestion.id) : false;

  // Answer selection handler with immediate autosave
  const handleSelectOption = async (optionIdx: number) => {
    if (!currentQuestion) return;
    setSaveStatus('saving');

    const updatedAns: TestAnswer = {
      id: `${session.id}_${currentQuestion.id}`,
      sessionId: session.id,
      applicantId: applicant.id,
      questionId: currentQuestion.id,
      selectedOptionIndex: optionIdx,
      isMarkedDoubt: isCurrentDoubt,
      answeredAt: new Date().toISOString(),
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updatedAns,
    }));

    try {
      await saveAnswerAutosave(
        session.id,
        applicant.id,
        currentQuestion.id,
        optionIdx,
        undefined,
        isCurrentDoubt
      );
      setSaveStatus('saved');
    } catch {
      setSaveStatus('offline');
    }
  };

  // Short answer text input handler
  const handleShortAnswerChange = async (text: string) => {
    if (!currentQuestion) return;
    setSaveStatus('saving');

    const updatedAns: TestAnswer = {
      id: `${session.id}_${currentQuestion.id}`,
      sessionId: session.id,
      applicantId: applicant.id,
      questionId: currentQuestion.id,
      essayAnswer: text,
      isMarkedDoubt: isCurrentDoubt,
      answeredAt: new Date().toISOString(),
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updatedAns,
    }));

    try {
      await saveAnswerAutosave(
        session.id,
        applicant.id,
        currentQuestion.id,
        undefined,
        text,
        isCurrentDoubt
      );
      setSaveStatus('saved');
    } catch {
      setSaveStatus('offline');
    }
  };

  // Toggle Doubt
  const handleToggleDoubt = async () => {
    if (!currentQuestion) return;
    const nextDoubt = !isCurrentDoubt;
    const newSet = new Set(doubtSet);
    if (nextDoubt) {
      newSet.add(currentQuestion.id);
    } else {
      newSet.delete(currentQuestion.id);
    }
    setDoubtSet(newSet);

    await toggleQuestionDoubt(session.id, currentQuestion.id, nextDoubt);

    // Save with doubt status updated
    if (currentAnswer) {
      await saveAnswerAutosave(
        session.id,
        applicant.id,
        currentQuestion.id,
        currentAnswer.selectedOptionIndex,
        currentAnswer.essayAnswer,
        nextDoubt
      );
    }
  };

  // Auto-submit when time expires
  const handleAutoSubmit = async (reason: string) => {
    setIsSubmitting(true);
    try {
      const { result } = await submitTestSession(session.id);
      setCompletedResult(result);
    } catch (err) {
      console.error('Error in auto submit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual submit action
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { result } = await submitTestSession(session.id);
      setCompletedResult(result);
      setShowSubmitModal(false);
    } catch (err) {
      console.error('Error submitting exam:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const totalAnsweredCount = Object.values(answers).filter(
    (a) => a.selectedOptionIndex !== undefined || (a.essayAnswer && a.essayAnswer.trim().length > 0)
  ).length;
  const totalDoubtCount = doubtSet.size;
  const totalUnansweredCount = Math.max(0, questions.length - totalAnsweredCount);

  // ================= 1. EXAM RULES BRIEFING SCREEN =================
  if (!hasStarted) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-[#0f2b5c] text-white p-6 sm:p-8 border-b border-amber-400/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                <Building2 className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Ujian Seleksi PPDB Online (CBT)
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-bold mt-1 text-white">
                  Petunjuk & Tata Tertib Ujian Seleksi
                </h2>
                <p className="text-xs text-slate-300">
                  Pondok Pesantren Al Ikhlas &bull; {schedule.title}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Candidate Identity Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Nama Calon Santri</span>
                <span className="font-bold text-slate-900 text-sm">{applicant.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Nomor Registrasi</span>
                <span className="font-mono font-bold text-amber-700">{applicant.registrationNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Durasi Ujian</span>
                <span className="font-bold text-[#0f2b5c]">{schedule.durationMinutes || 90} Menit</span>
              </div>
            </div>

            {/* Rules List */}
            <div className="space-y-3 text-xs text-slate-700">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Peraturan & Petunjuk Pengerjaan Soal:
              </h3>
              <ul className="space-y-2 list-disc list-inside text-slate-600 leading-relaxed pl-1">
                <li>Ujian terdiri dari <strong>{questions.length} butir soal</strong> materi potensi akademik dan keislaman.</li>
                <li>Waktu pengerjaan adalah <strong>{schedule.durationMinutes || 90} menit</strong> dan timer akan berjalan otomatis.</li>
                <li>Setiap pilihan jawaban Anda akan <strong>tersimpan secara otomatis</strong> ke sistem server.</li>
                <li>Jika koneksi internet terputus, jawaban tetap aman tersimpan di perangkat dan akan disinkronkan kembali saat online.</li>
                <li>Gunakan tombol <strong>&quot;Tandai Ragu-ragu&quot;</strong> jika Anda belum yakin dengan jawaban yang dipilih.</li>
                <li>Dilarang membuka tab lain, bekerjasama, atau menggunakan bantuan pihak lain selama ujian berlangsung.</li>
              </ul>
            </div>

            {/* Confirmation & Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={onExit}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Kembali ke Dashboard
              </button>

              <button
                type="button"
                onClick={() => setHasStarted(true)}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Mulai Kerjakan Ujian Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. POST-EXAM COMPLETED SUMMARY SCREEN =================
  if (completedResult) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-center p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Ujian CBT Selesai Dikirim
            </span>
            <h2 className="text-2xl font-serif font-bold text-slate-900 mt-2">
              Alhamdulillah, Jawaban Berhasil Diterima
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Jawaban ujian Ananda <strong>{applicant.fullName}</strong> telah tersimpan aman di basis data panitia PPDB Pondok Pesantren Al Ikhlas.
            </p>
          </div>

          {/* Conditional Immediate Score View if allowed */}
          {allowDirectView ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider">Hasil Tes Akademik Komputer (CBT):</span>
                <span className="text-lg font-black text-[#0f2b5c]">
                  {completedResult.cbtScore} / 100
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                  <span className="block text-[10px] font-semibold text-emerald-700">Jawaban Benar</span>
                  <span className="text-base font-bold">{completedResult.cbtCorrectCount || 0}</span>
                </div>
                <div className="p-2 bg-red-50 rounded-xl border border-red-200 text-red-900">
                  <span className="block text-[10px] font-semibold text-red-700">Jawaban Salah</span>
                  <span className="text-base font-bold">{completedResult.cbtIncorrectCount || 0}</span>
                </div>
                <div className="p-2 bg-slate-100 rounded-xl border border-slate-300 text-slate-800">
                  <span className="block text-[10px] font-semibold text-slate-600">Tidak Dijawab</span>
                  <span className="text-base font-bold">{completedResult.cbtUnansweredCount || 0}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 text-left space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Penetapan Rekapitulasi Nilai Akhir:
              </div>
              <p className="text-[11px] text-slate-600">
                Sesuai kebijakan panitia, hasil akhir kelulusan akan diplenokan bersama hasil ujian Tahfidz, Baca Al-Qur&apos;an, dan Wawancara sebelum diumumkan secara serentak.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex justify-center">
            <button
              type="button"
              onClick={onFinish}
              className="px-6 py-2.5 rounded-xl bg-[#0f2b5c] text-white text-xs font-bold hover:bg-[#153a7a] transition-all shadow-md"
            >
              Kembali ke Dashboard Santri
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 3. ACTIVE CBT EXAM VIEW =================
  return (
    <div className="space-y-4">
      {/* Top Sticky Exam Header */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Candidate Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0f2b5c] text-amber-300 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">{applicant.fullName}</div>
            <div className="text-[11px] font-mono text-slate-500">
              No. Reg: <strong className="text-amber-700">{applicant.registrationNumber}</strong> &bull; {schedule.title}
            </div>
          </div>
        </div>

        {/* Sync & Autosave Status Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border bg-slate-50">
            {saveStatus === 'saved' ? (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersimpan Otomatis</span>
              </>
            ) : saveStatus === 'saving' ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-700 font-semibold">Menyimpan...</span>
              </>
            ) : (
              <>
                <CloudAlert className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-blue-700">Tersimpan Lokal (Offline)</span>
              </>
            )}
          </div>

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs shadow-xs ${
              timeLeft < 300
                ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Sisa Waktu: {formatTime(timeLeft)}</span>
          </div>

          {/* Finish Button */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Selesai Ujian</span>
          </button>
        </div>
      </div>

      {/* Main Exam Layout: Question Area + Question Grid Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Question Card (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
          {/* Question Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#0f2b5c] text-white flex items-center justify-center font-bold text-xs">
                {currentIndex + 1}
              </span>
              <span className="text-xs font-bold text-slate-700">
                Soal Nomor {currentIndex + 1} dari {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Bobot: {currentQuestion.points} Poin
              </span>
              <button
                type="button"
                onClick={handleToggleDoubt}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                  isCurrentDoubt
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${isCurrentDoubt ? 'text-amber-600 fill-amber-600' : 'text-slate-400'}`} />
                <span>Ragu-ragu</span>
              </button>
            </div>
          </div>

          {/* Question Body */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {currentQuestion.questionText}
            </p>

            {currentQuestion.imageUrl && (
              <div className="p-2 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Ilustrasi Soal"
                  className="max-h-56 rounded-xl object-contain mx-auto"
                />
              </div>
            )}
          </div>

          {/* Answer Options */}
          {(currentQuestion.questionType === 'multiple_choice' || currentQuestion.questionType === 'true_false') &&
            currentQuestion.options && (
              <div className="space-y-2.5 pt-2">
                {currentQuestion.options.map((opt, idx) => {
                  const label = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
                  const isSelected = currentAnswer?.selectedOptionIndex === idx;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-3.5 rounded-2xl border text-xs flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'bg-blue-50/80 border-[#0f2b5c] ring-2 ring-[#0f2b5c]/20 text-slate-950 font-bold shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#0f2b5c] text-white'
                            : 'bg-white border border-slate-300 text-slate-600'
                        }`}
                      >
                        {label}
                      </span>
                      <span className="flex-1 leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

          {currentQuestion.questionType === 'short_answer' && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tuliskan Jawaban Anda:
              </label>
              <textarea
                rows={3}
                value={currentAnswer?.essayAnswer || ''}
                onChange={(e) => handleShortAnswerChange(e.target.value)}
                placeholder="Ketik jawaban singkat Anda di sini..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <span className="text-xs text-slate-400 font-mono">
              {currentIndex + 1} / {questions.length}
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-white transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>Selesai & Kirim</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Question Navigation Palette (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Nomor Soal Ujian
            </h4>
            <span className="text-xs font-bold text-[#0f2b5c]">
              {totalAnsweredCount} / {questions.length} Terjawab
            </span>
          </div>

          {/* Color Legend */}
          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-medium text-slate-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-md bg-emerald-600" />
              <span>Sudah ({totalAnsweredCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-md bg-amber-400" />
              <span>Ragu ({totalDoubtCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-md bg-slate-200" />
              <span>Belum ({totalUnansweredCount})</span>
            </div>
          </div>

          {/* Grid buttons */}
          <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
            {questions.map((q, idx) => {
              const ans = answers[q.id];
              const isAnswered =
                ans && (ans.selectedOptionIndex !== undefined || (ans.essayAnswer && ans.essayAnswer.trim().length > 0));
              const isDoubt = doubtSet.has(q.id);
              const isCurrent = idx === currentIndex;

              let btnStyle = 'bg-slate-100 text-slate-700 border-slate-200';
              if (isDoubt) {
                btnStyle = 'bg-amber-400 text-slate-950 font-bold border-amber-500';
              } else if (isAnswered) {
                btnStyle = 'bg-emerald-600 text-white font-bold border-emerald-700';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${btnStyle} ${
                    isCurrent ? 'ring-2 ring-[#0f2b5c] ring-offset-1 scale-105 shadow-sm' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Submit Trigger Card */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Semua Jawaban
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRM SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Selesai Ujian
                </h3>
                <p className="text-xs text-slate-500">
                  Periksa kembali rekapitulasi jawaban Anda.
                </p>
              </div>
            </div>

            {/* Recap Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-bold">
                <span className="block text-[10px] text-emerald-700 font-normal">Sudah Dijawab</span>
                {totalAnsweredCount}
              </div>
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-bold">
                <span className="block text-[10px] text-amber-700 font-normal">Ragu-ragu</span>
                {totalDoubtCount}
              </div>
              <div className="p-2 bg-slate-100 rounded-xl border border-slate-300 text-slate-800 font-bold">
                <span className="block text-[10px] text-slate-600 font-normal">Belum Dijawab</span>
                {totalUnansweredCount}
              </div>
            </div>

            {totalUnansweredCount > 0 && (
              <p className="text-xs text-red-600 font-medium">
                Peringatan: Masih terdapat {totalUnansweredCount} soal yang belum dijawab!
              </p>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Setelah dikirim, jawaban Anda akan dikunci dan dinilai secara otomatis. Anda tidak dapat mengubah jawaban lagi. Apakah Anda yakin ingin mengirim ujian ini sekarang?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Lanjutkan Ujian
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Mengirim & Menilai...' : 'Ya, Kirim Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
