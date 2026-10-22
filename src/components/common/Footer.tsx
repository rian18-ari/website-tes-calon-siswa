import React from 'react';
import { Building2, Heart, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 mt-auto text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-200">
              Pondok Pesantren Al Ikhlas
            </span>
            <span>&bull;</span>
            <span>Sistem Seleksi & Penilaian Santri Baru (PPDB)</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Sistem Terenkripsi & Aman
            </span>
            <span>Tahun Ajaran 2026/2027</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
