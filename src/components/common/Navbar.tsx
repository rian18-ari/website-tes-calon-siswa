import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  GraduationCap,
  LogOut,
  User,
  ShieldCheck,
  Award,
  Sparkles,
  ChevronDown,
  Building2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { UserRole } from '../../types/ppdb';

export const Navbar: React.FC = () => {
  const { userProfile, role, logout, isDemoMode, activateDemoRole } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem PPDB?')) {
      setLoggingOut(true);
      await logout();
      setLoggingOut(false);
    }
  };

  const getRoleBadge = (r: UserRole | null) => {
    switch (r) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            Panitia PPDB
          </span>
        );
      case 'examiner':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300">
            <Award className="w-3.5 h-3.5 text-blue-700" />
            Ustadz Penguji
          </span>
        );
      case 'applicant':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
            Calon Santri
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b1f3a] text-white border-b border-[#c59b27]/30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40 border border-amber-200/40">
              <Building2 className="w-6 h-6 text-[#0b1f3a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg md:text-xl tracking-tight text-white">
                  Pondok Pesantren Al Ikhlas
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  PPDB 2026/2027
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sistem Tes & Penilaian Calon Santri Baru
              </p>
            </div>
          </div>

          {/* User info & Quick Actions */}
          {userProfile && (
            <div className="flex items-center space-x-3">
              {/* Quick Demo Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  className="flex items-center gap-1.5 text-xs bg-slate-800/80 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-400/40 transition-colors shadow-sm"
                  title="Ganti peran pengguna untuk pengujian"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline font-medium">Uji Role:</span>
                  <span className="font-bold text-white capitalize">{role || 'Role'}</span>
                  {isDemoMode && (
                    <span className="text-[10px] px-1 py-0.2 bg-amber-500 text-slate-900 font-extrabold rounded">
                      Demo
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
                </button>

                {showDemoMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                      Pindah Role Uji Coba
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        activateDemoRole('admin');
                        setShowDemoMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                        role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        Panitia PPDB (Admin)
                      </span>
                      {role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        activateDemoRole('examiner');
                        setShowDemoMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                        role === 'examiner'
                          ? 'bg-blue-500/20 text-blue-300 font-semibold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-400" />
                        Penguji (Tahfidz & Wawancara)
                      </span>
                      {role === 'examiner' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        activateDemoRole('applicant');
                        setShowDemoMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                        role === 'applicant'
                          ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-400" />
                        Calon Santri (Peserta)
                      </span>
                      {role === 'applicant' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar & Name */}
              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-700">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-100 max-w-[150px] truncate">
                    {userProfile.displayName || 'Pengguna'}
                  </div>
                  <div>{getRoleBadge(role)}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-amber-300 font-bold border border-amber-400/40">
                  {userProfile.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-amber-300" />
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition-colors"
                title="Keluar dari sistem"
              >
                {loggingOut ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-red-300" />
                ) : (
                  <LogOut className="w-4 h-4 text-red-300" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
