import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  Lock,
  Mail,
  User,
  GraduationCap,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Phone,
  BookOpen,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    loginWithEmail,
    registerApplicant,
    loginWithGoogle,
    resetPassword,
    activateDemoRole,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGender, setRegGender] = useState<'L' | 'P'>('L');
  const [regNisn, setRegNisn] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regParent, setRegParent] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regProgram, setRegProgram] = useState('Kulliyyatul Mu\'allimin (KMI)');

  // Reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Feedback messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail || !loginPassword) {
      setErrorMessage('Mohon lengkapi email dan kata sandi.');
      return;
    }

    setSubmitting(true);
    const res = await loginWithEmail(loginEmail, loginPassword);
    setSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Gagal masuk akun.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regFullName || !regEmail || !regPassword || !regNisn) {
      setErrorMessage('Mohon lengkapi seluruh kolom yang bertanda bintang (*).');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Kata sandi harus minimal 6 karakter.');
      return;
    }

    setSubmitting(true);
    const res = await registerApplicant({
      email: regEmail,
      pass: regPassword,
      fullName: regFullName,
      gender: regGender,
      nisn: regNisn,
      previousSchool: regSchool || 'Tidak diisi',
      parentName: regParent || 'Wali Santri',
      parentPhone: regParentPhone || '-',
      program: regProgram,
    });
    setSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Gagal mendaftar akun calon santri.');
    } else {
      setSuccessMessage('Pendaftaran akun berhasil! Anda akan dialihkan ke dashboard.');
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    const res = await loginWithGoogle();
    setSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Gagal masuk dengan Google.');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setErrorMessage('Masukkan email Anda terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    const res = await resetPassword(resetEmail);
    setSubmitting(false);
    if (res.success) {
      setResetSent(true);
      setSuccessMessage(`Tautan pemulihan kata sandi telah dikirim ke ${resetEmail}.`);
    } else {
      setErrorMessage(res.error || 'Gagal mengirim email reset kata sandi.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Pondok Pesantren Branding & Announcements */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#091a32] via-[#0f2b5c] to-[#1e3a8a] text-white rounded-3xl p-8 shadow-xl border border-amber-400/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/50 mb-6 border border-amber-200">
              <Building2 className="w-8 h-8 text-[#091a32]" />
            </div>

            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
              Penerimaan Santri Baru (PPDB)
            </span>

            <h1 className="mt-3 text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white leading-tight">
              Pondok Pesantren <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400">
                Al Ikhlas
              </span>
            </h1>

            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Membangun generasi qur&apos;ani yang berakhlakul karimah, berwawasan luas, dan berkepribadian mandiri.
            </p>

            <div className="mt-8 space-y-4 pt-6 border-t border-slate-700/60 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-300 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100">Tahfidz & Wawancara</h4>
                  <p className="text-slate-400">Penilaian langsung oleh dewan asatidz teruji.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-300 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100">CBT Pengetahuan Akademik</h4>
                  <p className="text-slate-400">Tes komputer terstandar untuk materi agama & umum.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-300 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100">Penetapan Transparan</h4>
                  <p className="text-slate-400">Hasil dan keputusan seleksi dapat dipantau langsung.</p>
                </div>
              </div>
            </div>

            {/* Quick Demo Switcher Card for Evaluator */}
            <div className="mt-8 p-4 rounded-2xl bg-slate-900/80 border border-amber-400/40 shadow-inner">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Pengujian Cepat (Mode Demo)
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Pilih salah satu role untuk menguji seluruh alur tanpa membuat kredensial baru:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => activateDemoRole('admin')}
                  className="px-2.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Panitia
                </button>
                <button
                  type="button"
                  onClick={() => activateDemoRole('examiner')}
                  className="px-2.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                  Penguji
                </button>
                <button
                  type="button"
                  onClick={() => activateDemoRole('applicant')}
                  className="px-2.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  Santri
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Forms */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
          {/* Tabs: Masuk / Daftar */}
          <div className="flex border-b border-slate-200 pb-2 mb-6 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-[#0f2b5c] text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Lock className="w-4 h-4" />
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Daftar Calon Santri
            </button>
          </div>

          {/* Feedback alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && !showForgotPassword && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-medium text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] focus:border-transparent outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#0f2b5c] hover:bg-[#153a7a] text-white shadow-lg shadow-blue-950/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? 'Memproses...' : 'Masuk ke Sistem'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-medium">atau masuk dengan</span>
                </div>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                Masuk dengan Akun Google
              </button>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                Belum mendaftar PPDB? Klik tab{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-amber-700 hover:underline"
                >
                  Daftar Calon Santri
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {showForgotPassword && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0f2b5c] font-bold text-base mb-1">
                <KeyRound className="w-5 h-5 text-amber-600" />
                Pemulihan Kata Sandi Akun
              </div>
              <p className="text-xs text-slate-600">
                Masukkan alamat email yang terdaftar pada sistem PPDB. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
              </p>

              {resetSent ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-sm font-semibold text-emerald-900">
                    Email instruksi reset telah dikirim!
                  </p>
                  <p className="text-xs text-emerald-700">
                    Silakan periksa kotak masuk atau folder spam di email Anda, lalu ikuti instruksi yang tertera.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSent(false);
                    }}
                    className="mt-2 px-4 py-2 bg-[#0f2b5c] text-white text-xs font-bold rounded-xl"
                  >
                    Kembali ke Halaman Masuk
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Alamat Email Terdaftar
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-[#0f2b5c] text-white text-xs font-bold hover:bg-[#153a7a]"
                    >
                      {submitting ? 'Mengirim...' : 'Kirim Tautan Reset'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* REGISTER APPLICANT FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  Formulir pendaftaran Calon Santri Baru Tahun Ajaran 2026/2027. Akun admin dan penguji dikelola oleh panitia pusat.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Calon Santri *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Contoh: Muhammad Farhan Al-Ghifari"
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="L">Laki-laki (Santri Ikhwan)</option>
                    <option value="P">Perempuan (Santri Akhwat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NISN *
                  </label>
                  <input
                    type="text"
                    required
                    value={regNisn}
                    onChange={(e) => setRegNisn(e.target.value)}
                    placeholder="10 digit nomor NISN"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Asal Sekolah
                  </label>
                  <input
                    type="text"
                    value={regSchool}
                    onChange={(e) => setRegSchool(e.target.value)}
                    placeholder="Nama SD/MI/SMP Asal"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pilihan Jenjang / Program
                  </label>
                  <select
                    value={regProgram}
                    onChange={(e) => setRegProgram(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Kulliyyatul Mu'allimin (KMI)">Kulliyyatul Mu&apos;allimin (KMI 6 Tahun)</option>
                    <option value="Tahfidz Reguler">Tahfidz Al-Qur&apos;an Khusus</option>
                    <option value="Madrasah Tsanawiyah Unggulan">Madrasah Tsanawiyah Unggulan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Ayah / Wali
                  </label>
                  <input
                    type="text"
                    value={regParent}
                    onChange={(e) => setRegParent(e.target.value)}
                    placeholder="Nama Orang Tua/Wali"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    No. WhatsApp Orang Tua
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={regParentPhone}
                      onChange={(e) => setRegParentPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Alamat Email Akun *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@santri.com"
                      className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kata Sandi *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? 'Mendaftarkan...' : 'Daftar Calon Santri Sekarang'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
