import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Building2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  QrCode,
  BookOpen,
  Award,
  ChevronRight,
  ShieldCheck,
  User,
  Phone,
  Sparkles,
  ExternalLink,
  PlayCircle,
  Scale,
  RefreshCw,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Applicant,
  AdmissionDecision,
  QuestionBank,
  TestSchedule,
  TestSession,
  AnnouncementConfig,
} from '../../../types/ppdb';
import {
  getApplicantByUserId,
  getTestSchedules,
  getAdmissionDecisions,
  createApplicant,
  startTestSession,
  getActiveSessionForApplicant,
  getAnnouncementConfig,
} from '../../../services/ppdbService';
import { CbtExamView } from '../../exam/CbtExamView';
import { ScoreRecapModal } from '../../results/ScoreRecapModal';

export const ApplicantDashboard: React.FC = () => {
  const { currentUser, userProfile, applicantProfile, refreshApplicantProfile } = useAuth();
  const [applicant, setApplicant] = useState<Applicant | null>(applicantProfile);
  const [schedules, setSchedules] = useState<TestSchedule[]>([]);
  const [decision, setDecision] = useState<AdmissionDecision | null>(null);
  const [announcementConfig, setAnnouncementConfig] = useState<AnnouncementConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active CBT Exam states
  const [examSession, setExamSession] = useState<TestSession | null>(null);
  const [examQuestions, setExamQuestions] = useState<QuestionBank[]>([]);
  const [examSchedule, setExamSchedule] = useState<TestSchedule | null>(null);
  const [startingExam, setStartingExam] = useState<boolean>(false);
  const [showRecapModal, setShowRecapModal] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      let appData = applicantProfile;
      if (!appData && currentUser) {
        appData = await getApplicantByUserId(currentUser.uid);
      }

      // If still no applicant record for this user, auto-create one
      if (!appData && currentUser) {
        const randomNum = Math.floor(100 + Math.random() * 900);
        appData = await createApplicant({
          userId: currentUser.uid,
          registrationNumber: `PPDB-2026-${randomNum}`,
          fullName: currentUser.displayName || 'Calon Santri Baru',
          nisn: '0089012345',
          gender: 'L',
          birthPlace: 'Kota',
          birthDate: '2012-01-01',
          previousSchool: 'SD/MI Asal',
          parentName: 'Orang Tua / Wali Santri',
          parentPhone: '08123456789',
          address: 'Alamat tempat tinggal calon santri',
          wave: 'Gelombang 1',
          program: 'Kulliyyatul Mu\'allimin (KMI)',
          status: 'registered',
        });
        await refreshApplicantProfile();
      }

      setApplicant(appData);

      const [schedList, decisionList, annConfig] = await Promise.all([
        getTestSchedules(),
        getAdmissionDecisions(),
        getAnnouncementConfig(),
      ]);

      setSchedules(schedList);
      setAnnouncementConfig(annConfig);

      if (appData) {
        const myDecision = decisionList.find((d) => d.applicantId === appData?.id);
        setDecision(myDecision || null);

        // Check if there is an active session
        const activeSess = await getActiveSessionForApplicant(appData.id);
        if (activeSess && activeSess.status === 'in_progress') {
          // Find schedule
          const sched = schedList.find((s) => s.id === activeSess.scheduleId) || schedList[0];
          setExamSchedule(sched);
          setExamSession(activeSess);
        }
      }
    } catch (err) {
      console.error('Error fetching applicant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, applicantProfile]);

  const handleLaunchCbt = async (sched: TestSchedule) => {
    if (!applicant) return;
    setStartingExam(true);
    try {
      const { session, questions } = await startTestSession(applicant, sched, 'AKADEMIK');
      setExamSchedule(sched);
      setExamSession(session);
      setExamQuestions(questions);
    } catch (err) {
      console.error('Error launching CBT:', err);
      alert('Gagal memulai sesi ujian online: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setStartingExam(false);
    }
  };

  // If candidate is actively taking CBT exam, render CbtExamView
  if (examSession && examSchedule && examQuestions.length > 0) {
    return (
      <CbtExamView
        applicant={applicant!}
        schedule={examSchedule}
        session={examSession}
        questions={examQuestions}
        onFinish={() => {
          setExamSession(null);
          setExamSchedule(null);
          setExamQuestions([]);
          loadData();
        }}
        onExit={() => {
          setExamSession(null);
          setExamSchedule(null);
          setExamQuestions([]);
          loadData();
        }}
      />
    );
  }

  const steps = [
    { title: '1. Registrasi Akun', desc: 'Pembuatan akun & data awal', completed: true },
    {
      title: '2. Verifikasi Berkas',
      desc: 'Validasi dokumen oleh panitia',
      completed: applicant?.status !== 'registered',
      current: applicant?.status === 'registered',
    },
    {
      title: '3. Pelaksanaan Tes',
      desc: 'Tahfidz, CBT, & Wawancara',
      completed: applicant?.status === 'tested' || applicant?.status === 'announced',
      current: applicant?.status === 'testing' || applicant?.status === 'verified',
    },
    {
      title: '4. Pengumuman Kelulusan',
      desc: 'Pengesahan hasil seleksi santri',
      completed: applicant?.status === 'announced' || decision !== null,
      current: applicant?.status === 'tested' && !decision,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#091a32] via-[#0f2b5c] to-[#1e3a8a] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-400/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              Portal Calon Santri Baru PPDB 2026/2027
            </div>
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-white leading-tight">
              Ahlan wa Sahlan, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400">
                {applicant?.fullName || userProfile?.displayName || 'Calon Santri'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
              Selamat datang di sistem seleksi online Pondok Pesantren Al Ikhlas. Simpan nomor pendaftaran Anda, ikuti ujian CBT secara mandiri, dan periksa rekapitulasi nilai Anda di bawah ini.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowRecapModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
              >
                <Scale className="w-4 h-4 text-amber-400" />
                Lihat Rekapitulasi Nilai Saya
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-amber-300/30 text-center flex flex-col items-center min-w-[200px]">
            <span className="text-[10px] uppercase font-bold text-amber-200 tracking-wider">
              Nomor Registrasi Resmi
            </span>
            <div className="mt-1 text-xl sm:text-2xl font-mono font-extrabold text-white tracking-wider">
              {applicant?.registrationNumber || 'PPDB-2026-000'}
            </div>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
              <CheckCircle2 className="w-3 h-3" />
              {applicant?.status === 'announced' ? 'Hasil Diumumkan' :
               applicant?.status === 'tested' ? 'Selesai Tes' :
               applicant?.status === 'testing' ? 'Sedang Tes' : 'Akun Terdaftar'}
            </span>
          </div>
        </div>
      </div>

      {/* Official Admission Decree Banner if Announced and Published */}
      {announcementConfig?.isPublished && decision ? (
        <div
          className={`p-6 rounded-3xl border shadow-lg animate-in fade-in ${
            decision.decision === 'accepted'
              ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 border-emerald-400/40 text-white'
              : decision.decision === 'waitlist'
              ? 'bg-gradient-to-br from-amber-900 via-amber-800 to-slate-900 border-amber-400/40 text-white'
              : 'bg-gradient-to-br from-red-950 via-slate-900 to-slate-950 border-red-500/40 text-white'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/20">
              <Award className="w-8 h-8 text-amber-300" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Surat Keputusan Panitia Seleksi PPDB Resmi
              </div>
              <h3 className="text-xl font-bold font-serif mt-1">
                {decision.decision === 'accepted'
                  ? 'SELAMAT! Ananda Dinyatakan LULUS SELEKSI'
                  : decision.decision === 'waitlist'
                  ? 'PEMBERITAHUAN: Ananda Masuk Daftar CADANGAN'
                  : 'PEMBERITAHUAN: Belum Memenuhi Kriteria Kelulusan'}
              </h3>
              <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                {decision.notes}
              </p>

              {announcementConfig.publicNotice && (
                <div className="mt-3 p-3 rounded-xl bg-white/10 border border-white/10 text-slate-200 text-xs italic">
                  &ldquo;{announcementConfig.publicNotice}&rdquo;
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3">
                <div className="space-y-0.5">
                  <div>Tanggal Penetapan: {new Date(decision.decisionDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
                  <div className="text-[11px] text-amber-300">Pondok Pesantren Al Ikhlas &bull; Panitia Pusat PPDB</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Printer className="w-4 h-4 text-[#0f2b5c]" />
                    <span>Cetak Surat Pengumuman</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (applicant?.status === 'tested' || applicant?.status === 'testing' || applicant?.status === 'announced') ? (
        <div className="p-6 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 text-slate-900 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#0f2b5c] text-white">
              <Clock className="w-6 h-6 text-amber-300" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-[#0f2b5c] uppercase tracking-wider">
                Tahap Sidang Pleno & Verifikasi Nilai
              </div>
              <h3 className="text-base font-bold font-serif text-slate-900 mt-0.5">
                Hasil Seleksi Masuk Masih Dalam Sidang Pleno Panitia
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-3xl">
                Alhamdulillah, berkas ujian Anda telah tercatat. Panitia PPDB dan Dewan Asatidz Pondok Pesantren Al Ikhlas saat ini sedang menyelenggarakan sidang pleno rekapitulasi penilaian akhir.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Jadwal Pengumuman Resmi: <strong>{announcementConfig?.publishDate ? new Date(announcementConfig.publishDate).toLocaleDateString('id-ID', { dateStyle: 'full' }) : 'Segera Diumumkan'}</strong></span>
                </div>
                <span className="text-[11px] font-semibold text-slate-600">Simpan nomor registrasi untuk verifikasi</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Selection Progress Flow */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          Tahapan Alur Seleksi Masuk
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                step.completed
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : step.current
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950 ring-2 ring-amber-400/40'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">{step.title}</span>
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : step.current ? (
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                )}
              </div>
              <p className="text-[11px] leading-relaxed opacity-80">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Virtual Participant Card & Exam Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Virtual Participant ID Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#091a32] via-[#0f2b5c] to-[#15325b] text-white rounded-3xl p-6 shadow-xl border border-amber-400/30 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
            <Building2 className="w-64 h-64 text-amber-300" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-400/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-[#091a32] font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-serif font-bold text-xs tracking-wide">
                    PONDOK PESANTREN AL IKHLAS
                  </div>
                  <div className="text-[9px] text-amber-200 tracking-wider uppercase">
                    Kartu Tanda Peserta Ujian PPDB
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                2026/2027
              </span>
            </div>

            {/* Photo & Main Details */}
            <div className="flex items-start gap-4 pt-1">
              <div className="w-20 h-24 rounded-xl bg-slate-800 border-2 border-amber-400/50 flex flex-col items-center justify-center text-slate-400 flex-shrink-0 shadow-md">
                <User className="w-8 h-8 text-amber-300 mb-1" />
                <span className="text-[9px] uppercase font-bold text-amber-200">Foto 3x4</span>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Nama Calon Santri</div>
                  <div className="text-sm font-bold text-white truncate">{applicant?.fullName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">No. Registrasi / NISN</div>
                  <div className="text-xs font-mono font-bold text-amber-300">
                    {applicant?.registrationNumber} / {applicant?.nisn}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Pilihan Program</div>
                  <div className="text-xs text-slate-200 font-medium truncate">{applicant?.program}</div>
                </div>
              </div>
            </div>

            {/* Bottom Barcode / Verification */}
            <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
              <div>
                <span className="text-slate-400">Asal Sekolah:</span>
                <div className="text-slate-200 font-semibold">{applicant?.previousSchool}</div>
              </div>

              <div className="flex items-center gap-1.5 bg-white text-slate-900 px-2.5 py-1 rounded-lg font-mono font-bold">
                <QrCode className="w-4 h-4 text-slate-900" />
                <span>PPDB-VERIFIED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Test Schedules & Exam Guide */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Jadwal & Pelaksanaan Ujian Seleksi
              </h3>
              <p className="text-xs text-slate-500">
                Klik tombol mulai untuk mengerjakan tes CBT online atau hadir di ruang ujian fisik.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {applicant?.wave || 'Gelombang 1'}
            </span>
          </div>

          <div className="space-y-3">
            {schedules.map((s) => {
              const isCbt = s.categoryId === 'AKADEMIK' || s.title.toLowerCase().includes('cbt') || s.categoryId === 'all';
              const isScheduleOpen = s.status !== 'closed' && s.status !== 'cancelled';

              return (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{s.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ruang: <strong>{s.room}</strong> &bull; Durasi: {s.durationMinutes || 90} Menit
                      </p>
                    </div>

                    {isCbt && isScheduleOpen && (
                      <button
                        type="button"
                        onClick={() => handleLaunchCbt(s)}
                        disabled={startingExam}
                        className="px-4 py-2 rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0"
                      >
                        <PlayCircle className="w-4 h-4 text-amber-300" />
                        <span>{startingExam ? 'Menyiapkan...' : 'Kerjakan CBT Online'}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>Tanggal: <strong>{s.examDate}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Waktu: <strong>{s.startTime} - {s.endTime} WIB</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guide Checklist */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Perlengkapan yang Wajib Dibawa Saat Ujian:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] pl-1">
              <li>Membawa cetak Kartu Tanda Peserta PPDB atau memperlihatkan melalui smartphone.</li>
              <li>Mengenakan pakaian muslim sopan (Koko putih, peci hitam untuk ikhwan; busana muslimah syar&apos;i untuk akhwat).</li>
              <li>Membawa Al-Qur&apos;an mushaf standar untuk persiapan ujian Tahfidz.</li>
              <li>Orang tua/wali wajib hadir mendampingi untuk sesi wawancara kesiapan berasrama.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SCORE RECAP MODAL */}
      {showRecapModal && applicant && (
        <ScoreRecapModal
          applicant={applicant}
          onClose={() => setShowRecapModal(false)}
        />
      )}
    </div>
  );
};
