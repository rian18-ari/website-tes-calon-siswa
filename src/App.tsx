/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LoginPage } from './components/auth/LoginPage';
import { AdminDashboard } from './components/dashboard/admin/AdminDashboard';
import { ExaminerDashboard } from './components/dashboard/examiner/ExaminerDashboard';
import { ApplicantDashboard } from './components/dashboard/applicant/ApplicantDashboard';
import { testConnection } from './firebase/config';
import { Building2, Sparkles, RefreshCw } from 'lucide-react';

const MainContent: React.FC = () => {
  const { userProfile, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-900/30 animate-bounce mb-4 border border-amber-300">
          <Building2 className="w-8 h-8 text-[#091a32]" />
        </div>
        <h3 className="font-serif font-bold text-lg text-slate-800">
          Pondok Pesantren Al Ikhlas
        </h3>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
          Memuat sistem PPDB & otentikasi...
        </p>
      </div>
    );
  }

  if (!userProfile) {
    return <LoginPage />;
  }

  // Role-based dashboard dispatch
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'examiner':
      return <ExaminerDashboard />;
    case 'applicant':
    default:
      return <ApplicantDashboard />;
  }
};

export default function App() {
  useEffect(() => {
    // Mandated by Firebase Integration Skill: test connection on initial boot
    testConnection().catch((err) => {
      console.warn('Initial connection check notice:', err);
    });
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-amber-400 selection:text-slate-950">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <MainContent />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
