import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  RefreshCw,
} from 'lucide-react';
import { batchImportApplicants } from '../../services/ppdbService';

interface CsvImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

interface ParsedRow {
  fullName: string;
  nisn: string;
  gender: 'L' | 'P';
  program: string;
  previousSchool: string;
  parentName: string;
  parentPhone: string;
  address: string;
  wave: string;
  isValid: boolean;
  error?: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  onClose,
  onImported,
}) => {
  const [csvText, setCsvText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errors: string[] } | null>(null);

  // Sample CSV Template Generator
  const downloadTemplate = () => {
    const header = 'Nama Lengkap,NISN,Jenis Kelamin,Program,Asal Sekolah,Nama Wali,No HP,Alamat,Gelombang\n';
    const sampleRows = [
      'Muhammad Al-Ghifari,0081234567,L,Kulliyyatul Mu\'allimin (KMI),SDIT Al-Furqan,H. Ahmad Solihin,081298765432,Jl. Raya Pondok No 15 Bandung,Gelombang 1',
      'Fatimah Az-Zahra,0087654321,P,Tahfidz Reguler,MI Nurul Iman,Drs. H. Mulyadi,081387654321,Komplek Pesantren Indah Blok B2,Gelombang 1',
      'Zaid bin Tsabit,0091122334,L,Madrasah Tsanawiyah Unggulan,SDN 2 Cibiru,Ust. Zulkifli,081566778899,Desa Sukamaju RT 03/05,Gelombang 1',
    ].join('\n');

    const blob = new Blob([header + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_santri_ppdb_alikhlas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setCsvText(text);
        parseCsv(text);
      };
      reader.readAsText(file);
    }
  };

  const parseCsv = (raw: string) => {
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    // Check if first row is header
    const startIndex = lines[0].toLowerCase().includes('nama') ? 1 : 0;
    const rows: ParsedRow[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Split by comma or semicolon
      const cols = line.split(/[,;]/).map((c) => c.replace(/^["']|["']$/g, '').trim());

      const fullName = cols[0] || '';
      const nisn = cols[1] || '';
      const genderRaw = cols[2]?.toUpperCase() || 'L';
      const gender: 'L' | 'P' = genderRaw === 'P' || genderRaw === 'PEREMPUAN' ? 'P' : 'L';
      const program = cols[3] || 'Kulliyyatul Mu\'allimin (KMI)';
      const previousSchool = cols[4] || 'SD/MI Asal';
      const parentName = cols[5] || 'Wali Santri';
      const parentPhone = cols[6] || '-';
      const address = cols[7] || 'Alamat Santri';
      const wave = cols[8] || 'Gelombang 1';

      let isValid = true;
      let error = '';

      if (!fullName) {
        isValid = false;
        error = 'Nama tidak boleh kosong';
      } else if (!nisn) {
        isValid = false;
        error = 'NISN tidak boleh kosong';
      }

      rows.push({
        fullName,
        nisn,
        gender,
        program,
        previousSchool,
        parentName,
        parentPhone,
        address,
        wave,
        isValid,
        error,
      });
    }

    setParsedRows(rows);
    setImportResult(null);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    try {
      const res = await batchImportApplicants(validRows);
      setImportResult(res);
      setImporting(false);
      if (res.successCount > 0) {
        setTimeout(() => {
          onImported();
        }, 1200);
      }
    } catch (err: any) {
      setImporting(false);
      setImportResult({
        successCount: 0,
        errors: [err.message || 'Gagal memproses batch import'],
      });
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <FileSpreadsheet className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Impor Data Calon Santri via CSV
              </h3>
              <p className="text-xs text-slate-300">
                Pondok Pesantren Al Ikhlas &bull; Batch Upload Registrasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Instructions and Download Template */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
            <div>
              <h4 className="font-bold text-amber-950">Gunakan Format Kolom Standar:</h4>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Nama Lengkap, NISN, Jenis Kelamin (L/P), Program, Asal Sekolah, Nama Wali, No HP, Alamat, Gelombang
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100/70 transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              Unduh Template CSV
            </button>
          </div>

          {/* Upload and Paste inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilih Berkas CSV
              </label>
              <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0f2b5c] bg-slate-50 cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Klik untuk upload file .csv</span>
                <span className="text-[10px] text-slate-400">atau drag & drop file ke sini</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Atau Tempel Teks CSV
              </label>
              <textarea
                rows={4}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  parseCsv(e.target.value);
                }}
                placeholder="Tempel baris CSV langsung di sini..."
                className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
              />
            </div>
          </div>

          {/* Result Alert if Done */}
          {importResult && (
            <div
              className={`p-4 rounded-2xl border text-xs ${
                importResult.successCount > 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Berhasil mengimpor {importResult.successCount} calon santri ke database!
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-2 text-[11px] text-red-700 space-y-0.5">
                  <div className="font-semibold">Catatan baris gagal:</div>
                  {importResult.errors.map((e, idx) => (
                    <div key={idx}>&bull; {e}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Pratinjau Data ({parsedRows.length} Calon Santri Terdeteksi)</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {validCount} Siap Diimpor
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                      {invalidCount} Tidak Valid
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-[11px] text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 uppercase tracking-wider">
                    <tr>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Nama Santri</th>
                      <th className="py-2 px-3">NISN / JK</th>
                      <th className="py-2 px-3">Program</th>
                      <th className="py-2 px-3">Asal Sekolah</th>
                      <th className="py-2 px-3">Wali / HP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-red-50/50'}>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <span className="text-red-600 font-bold" title={row.error}>
                              <AlertCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{row.fullName || '-'}</td>
                        <td className="py-2 px-3 font-mono">{row.nisn || '-'} ({row.gender})</td>
                        <td className="py-2 px-3 text-slate-600">{row.program}</td>
                        <td className="py-2 px-3 text-slate-600">{row.previousSchool}</td>
                        <td className="py-2 px-3 text-slate-600">{row.parentName} ({row.parentPhone})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={importing || validCount === 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#0f2b5c] hover:bg-[#153a7a] rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  Mengimpor Data...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-300" />
                  Impor {validCount} Calon Santri
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
