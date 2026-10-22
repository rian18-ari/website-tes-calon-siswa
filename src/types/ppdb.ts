export type UserRole = 'admin' | 'examiner' | 'applicant';

export type ApplicantStatus = 
  | 'registered'    // Baru mendaftar
  | 'verified'      // Dokumen terverifikasi, siap tes
  | 'testing'       // Sedang dalam masa pelaksanaan tes
  | 'tested'        // Selesai semua rangkaian tes
  | 'announced'     // Keputusan akhir diumumkan
  | 'archived';     // Data dinonaktifkan / diarsipkan

export type AdmissionDecisionType = 'accepted' | 'rejected' | 'waitlist' | 'pending';

export type TestCategoryType = 'cbt' | 'examiner' | 'interview' | 'practical';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Applicant {
  id: string;
  userId: string;
  registrationNumber: string; // contoh: PPDB-2026-001
  fullName: string;
  nisn: string;
  gender: 'L' | 'P';
  birthPlace: string;
  birthDate: string;
  previousSchool: string;
  parentName: string;
  parentPhone: string;
  address: string;
  wave: string; // contoh: "Gelombang 1"
  program: string; // contoh: "Tahfidz Reguler", "Kulliyyatul Mu'allimin", "Madrasah Tsanawiyah"
  status: ApplicantStatus;
  isActive?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestCategory {
  id: string;
  code: string; // AKADEMIK, QURAN, HAFALAN, WAWANCARA, PRAKTIK
  name: string;
  description: string;
  type: TestCategoryType;
  passingGrade: number; // KKM, contoh: 75
  weight: number; // Bobot %, total harus 100%
  order: number;
  isActive?: boolean;
}

export interface QuestionBank {
  id: string;
  categoryId: string;
  categoryName?: string;
  questionText: string;
  imageUrl?: string;
  questionType: QuestionType;
  options?: string[]; // Pilihan jawaban A, B, C, D (untuk PG & Benar/Salah)
  correctOptionIndex?: number; // Index 0..3 untuk PG, 0..1 untuk Benar/Salah
  correctAnswerText?: string; // Teks jawaban untuk isian singkat
  points: number; // Bobot nilai soal (default 10)
  explanation?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestSchedule {
  id: string;
  title: string;
  categoryId: string; // ID kategori tes atau 'all'
  categoryName?: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // 08:00
  endTime: string; // 10:00
  durationMinutes: number; // Durasi pengerjaan dalam menit
  room: string; // Lab Komputer 1 / Masjid / Aula
  quota: number;
  scheduledCount?: number;
  status: 'open' | 'closed' | 'cancelled';
  targetProgram?: string; // "Semua Program" atau nama program spesifik
  examinerId?: string;
  examinerName?: string;
  wave: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemGradingConfig {
  id: string;
  totalWeight: number; // Total bobot kategori aktif (harus 100%)
  aggregatePassingGrade: number; // Passing grade total kelulusan (contoh: 75)
  shuffleQuestions: boolean; // Acak urutan soal
  shuffleOptions: boolean; // Acak urutan pilihan jawaban
  allowDirectResultView: boolean; // Apakah peserta boleh langsung melihat hasil
  scoringPolicy: 'standard' | 'penalty'; // standard: salah=0, penalty: salah=-1
  defaultDurationMinutes: number;
  sampleQuestionCount: number; // Jumlah soal yang diambil dari bank soal
  updatedAt?: string;
}

export interface TestSession {
  id: string;
  applicantId: string;
  applicantName?: string;
  registrationNumber?: string;
  scheduleId: string;
  categoryId: string;
  categoryName?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'timeout' | 'absent';
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  durationMinutes: number;
  totalQuestions: number;
  totalAnswered: number;
  markedDoubtQuestionIds?: string[];
  lastSavedAt?: string;
  cbtScore?: number;
}

export interface TestAnswer {
  id: string; // Typically `${sessionId}_${questionId}`
  sessionId: string;
  applicantId: string;
  questionId: string;
  selectedOptionIndex?: number;
  essayAnswer?: string;
  isMarkedDoubt?: boolean;
  isCorrect?: boolean;
  scoreAwarded?: number;
  answeredAt: string;
  syncStatus?: 'synced' | 'pending';
}

export interface TestResult {
  id: string;
  applicantId: string;
  applicantName?: string;
  registrationNumber?: string;
  cbtScore?: number;
  cbtCorrectCount?: number;
  cbtIncorrectCount?: number;
  cbtUnansweredCount?: number;
  categoryScores: Record<string, number>; // { [categoryId]: score (0-100) }
  totalScore: number; // 0-100 weighted final score
  isCompleted: boolean; // True when all required categories have scores
  missingCategories?: string[];
  status: 'pending' | 'passed' | 'failed';
  generatedAt: string;
  automaticRecommendation?: 'recommended_accepted' | 'recommended_waitlist' | 'recommended_rejected' | 'pending_incomplete';
  recommendationReason?: string;
  calculationConfigSnapshot?: {
    aggregatePassingGrade: number;
    categoryWeights: Record<string, number>;
    categoryPassingGrades: Record<string, number>;
    calculatedAt: string;
  };
}

export interface ExaminerAssessment {
  id: string;
  applicantId: string;
  applicantName?: string;
  registrationNumber?: string;
  examinerId: string;
  examinerName?: string;
  categoryId: string; // QURAN, HAFALAN, WAWANCARA, PRAKTIK
  categoryName?: string;
  aspectScores: {
    // Al-Qur'an & Tajwid
    quran_tajwid?: number;
    quran_makharij?: number;
    quran_kelancaran?: number;
    // Tahfidz & Sambung Ayat
    hafalan_kelancaran?: number;
    hafalan_tajwid?: number;
    hafalan_makharij?: number;
    hafalan_sambung_ayat?: number;
    // Wawancara
    wawancara_adab?: number;
    wawancara_kemandirian?: number;
    wawancara_komitmen_wali?: number;
    // Praktik Ibadah
    praktik_wudhu?: number;
    praktik_shalat?: number;
    praktik_doa?: number;
    [key: string]: number | undefined;
  };
  totalScore: number; // Nilai akhir 0-100
  notes: string; // Catatan rekomendasi penguji
  isDraft: boolean; // True jika masih disimpan sementara
  evaluatedAt: string;
  updatedAt?: string;
}

export interface AdmissionDecision {
  id: string;
  applicantId: string;
  applicantName?: string;
  registrationNumber?: string;
  decision: AdmissionDecisionType;
  notes?: string;
  decisionDate: string;
  decidedBy: string; // Admin UID or Name
  decidedByEmail?: string;
  updatedAt?: string;
}

export interface DecisionAuditLog {
  id: string;
  applicantId: string;
  applicantName: string;
  registrationNumber: string;
  previousDecision?: AdmissionDecisionType;
  newDecision: AdmissionDecisionType;
  changedBy: string;
  changedByEmail?: string;
  reason: string;
  timestamp: string;
}

export interface AnnouncementConfig {
  id: string; // 'current'
  isPublished: boolean;
  publishDate: string; // YYYY-MM-DDTHH:mm
  showCategoryBreakdown: boolean;
  showExaminerNotes: boolean;
  publicNotice: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PPDBStatistics {
  totalApplicants: number;
  untestedApplicants: number;
  testedApplicants: number;
  incompleteAssessmentApplicants: number;
  pendingDecisionApplicants: number;
  acceptedApplicants: number;
  rejectedApplicants: number;
  waitlistApplicants: number;
  archivedApplicants?: number;
  averageScore?: number;
  passingRate?: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface CategoryPerformanceStat {
  categoryId: string;
  categoryName: string;
  weight: number;
  passingGrade: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  testedCount: number;
}

export interface ProgramStat {
  program: string;
  total: number;
  accepted: number;
  rejected: number;
  waitlist: number;
  pending: number;
}
