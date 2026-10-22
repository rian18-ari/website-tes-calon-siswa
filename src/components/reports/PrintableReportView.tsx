import React, { useState } from 'react';
import { Printer, X, Building2, Filter, Award, CheckCircle2 } from 'lucide-react';
import { Applicant, AdmissionDecision, TestCategory, TestResult } from '../../types/ppdb';

interface PrintableReportViewProps {
  applicants: Applicant[];
  results: Map<string, TestResult>;
  decisions: Map<string, AdmissionDecision>;
  categories: TestCategory[];
  initialFilter?: string;
  onClose: () => void;
}

export const PrintableReportView: React.FC<PrintableReportViewProps> = ({
  applicants,
  results,
  decisions,
  categories,
  initialFilter = 'all',
  onClose,
}) => {
  const [reportType, setReportType] = useState<string>(initialFilter);
  const [programFilter, setProgramFilter] = useState<string>('all');

  const filteredApplicants = applicants.filter((a) => {
    if (a.status === 'archived') return false;

    if (programFilter !== 'all' && a.program !== programFilter) {
      return false;
    }

    const dec = decisions.get(a.id);
    const res = results.get(a.id);

    if (reportType === 'accepted') {
      return dec?.decision === 'accepted';
    } else if (reportType === 'rejected') {
      return dec?.decision === 'rejected';
    } else if (reportType === 'waitlist') {
      return dec?.decision === 'waitlist';
    } else if (reportType === 'incomplete') {
      return !res || !res.isCompleted;
    }

    return true;
  });

  const distinctPrograms = Array.from(new Set(applicants.map((a) => a.program).filter(Boolean)));

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'accepted':
        return 'DAFTAR CALON SANTRI BARU DINYATAKAN LULUS SELEKSI';
      case 'waitlist':
        return 'DAFTAR CALON SANTRI BARU CADANGAN SELEKSI';
      case 'rejected':
        return 'DAFTAR CALON SANTRI BARU BELUM LULUS SELEKSI';
      case 'incomplete':
        return 'DAFTAR CALON SANTRI DENGAN PENILAIAN BELUM LENGKAP';
      default:
        return 'REKAPITULASI HASIL PENILAIAN & SELEKSI PPDB LENGKAP';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex flex-col items-center p-2 sm:p-6">
      {/* Top Floating Control Bar (Hidden when printing via print:hidden) */}
      <div className="w-full max-w-5xl bg-white rounded-2xl p-4 mb-4 shadow-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Format Cetak Laporan Resmi PPDB</h4>
            <p className="text-xs text-slate-500">Pilih jenis laporan yang ingin dicetak atau disimpan ke PDF.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Report Type Selector */}
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-none"
          >
            <option value="all">Semua Peserta (Rekap Lengkap)</option>
            <option value="accepted">Santri Lulus Diterima</option>
            <option value="waitlist">Santri Cadangan</option>
            <option value="rejected">Santri Tidak Lulus</option>
            <option value="incomplete">Penilaian Belum Lengkap</option>
          </select>

          {/* Program Filter */}
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 outline-none"
          >
            <option value="all">Semua Program</option>
            {distinctPrograms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#0f2b5c] hover:bg-[#153a7a] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak / Simpan PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Official Printable Sheet Container */}
      <div className="w-full max-w-5xl bg-white rounded-none sm:rounded-2xl p-8 sm:p-12 shadow-2xl text-slate-900 text-xs font-serif print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full">
        {/* Kop Surat Resmi */}
        <div className="border-b-4 border-double border-slate-900 pb-4 text-center relative mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full border-2 border-[#091a32] flex items-center justify-center text-[#091a32] font-bold">
              <Building2 className="w-8 h-8 text-[#091a32]" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-600 font-sans font-semibold">
                YAYASAN PENDIDIKAN PESANTREN ISLAM
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-[#091a32]">
                PONDOK PESANTREN AL IKHLAS
              </h1>
              <div className="text-[11px] text-slate-600 font-sans leading-tight mt-0.5">
                Kulliyyatul Mu&apos;allimin Al-Islamiyyah &bull; Tahfidzul Qur&apos;an &bull; Madrasah Tsanawiyah
                <br />
                Jl. Pesantren No. 01, Cisauk, Tangerang, Banten 15345 &bull; Telp: (021) 756-1234
              </div>
            </div>
          </div>
        </div>

        {/* Document Decree Title */}
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-sm sm:text-base font-bold uppercase underline tracking-wide">
            {getReportTitle()}
          </h2>
          <div className="text-[11px] text-slate-600 font-sans">
            Nomor: 042/PPDB-AI/SK/{new Date().getFullYear()} &bull; Tahun Ajaran 2026/2027
          </div>
          <div className="text-[10px] text-slate-500 font-sans italic">
            Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} &bull; Total: {filteredApplicants.length} Calon Santri
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto mb-8 font-sans">
          <table className="w-full text-left border-collapse border border-slate-400 text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold text-center">
                <th className="border border-slate-400 p-2 w-8">No</th>
                <th className="border border-slate-400 p-2 w-24">No. Registrasi</th>
                <th className="border border-slate-400 p-2">Nama Calon Santri</th>
                <th className="border border-slate-400 p-2 w-12">L/P</th>
                <th className="border border-slate-400 p-2">Program Pilihan</th>
                {categories.map((c) => (
                  <th key={c.id} className="border border-slate-400 p-2 w-16">
                    {c.name.replace('Tes ', '')} ({c.weight}%)
                  </th>
                ))}
                <th className="border border-slate-400 p-2 w-16">Nilai Akhir</th>
                <th className="border border-slate-400 p-2 w-28">Status Keputusan</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.length === 0 ? (
                <tr>
                  <td colSpan={7 + categories.length} className="border border-slate-400 p-6 text-center text-slate-400 italic">
                    Tidak ada data santri yang memenuhi filter laporan ini.
                  </td>
                </tr>
              ) : (
                filteredApplicants.map((a, idx) => {
                  const res = results.get(a.id);
                  const dec = decisions.get(a.id);

                  return (
                    <tr key={a.id} className="even:bg-slate-50">
                      <td className="border border-slate-400 p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 p-1.5 font-mono font-bold text-center">
                        {a.registrationNumber}
                      </td>
                      <td className="border border-slate-400 p-1.5 font-bold">
                        {a.fullName}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center">{a.gender}</td>
                      <td className="border border-slate-400 p-1.5">{a.program}</td>

                      {categories.map((c) => {
                        const s = res?.categoryScores[c.code] !== undefined ? res.categoryScores[c.code] : res?.categoryScores[c.id];
                        return (
                          <td key={c.id} className="border border-slate-400 p-1.5 text-center font-mono">
                            {s !== undefined ? s : '-'}
                          </td>
                        );
                      })}

                      <td className="border border-slate-400 p-1.5 text-center font-mono font-bold bg-slate-100">
                        {res ? res.totalScore : '-'}
                      </td>

                      <td className="border border-slate-400 p-1.5 text-center font-bold">
                        {dec ? (
                          dec.decision === 'accepted' ? (
                            'LULUS'
                          ) : dec.decision === 'waitlist' ? (
                            'CADANGAN'
                          ) : (
                            'TIDAK LULUS'
                          )
                        ) : (
                          <span className="text-slate-400 font-normal italic">Menunggu Pleno</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures Block */}
        <div className="pt-6 grid grid-cols-2 text-center text-xs font-sans text-slate-800">
          <div className="space-y-16">
            <div>
              <div>Mengetahui,</div>
              <div className="font-bold">Pengasuh Pondok Pesantren Al Ikhlas</div>
            </div>
            <div>
              <div className="font-bold underline text-sm">K.H. Ahmad Syahid, M.A.</div>
              <div className="text-[11px] text-slate-500">Pimpinan Pesantren</div>
            </div>
          </div>

          <div className="space-y-16">
            <div>
              <div>Tangerang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="font-bold">Ketua Panitia PPDB 2026/2027</div>
            </div>
            <div>
              <div className="font-bold underline text-sm">Ust. Dr. Muhammad Fikri, M.Pd.I</div>
              <div className="text-[11px] text-slate-500">NIP: 198204152008011004</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
