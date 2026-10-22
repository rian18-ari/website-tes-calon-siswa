import React, { useEffect, useState } from 'react';
import { X, History, Search, Filter, ShieldCheck, User } from 'lucide-react';
import { DecisionAuditLog } from '../../types/ppdb';
import { getDecisionAuditLogs } from '../../services/ppdbService';

interface DecisionAuditHistoryModalProps {
  onClose: () => void;
}

export const DecisionAuditHistoryModal: React.FC<DecisionAuditHistoryModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<DecisionAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await getDecisionAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Error fetching decision audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      log.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      log.changedBy.toLowerCase().includes(search.toLowerCase()) ||
      log.reason.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0f2b5c] text-white p-5 flex items-center justify-between border-b border-amber-400/30 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                Sistem Audit & Keamanan PPDB
              </div>
              <h3 className="text-base font-bold text-white">
                Log Riwayat Perubahan Keputusan Pleno Kelulusan
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama santri, no. registrasi, panitia, atau alasan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2b5c] outline-none"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-5 h-5 border-2 border-[#0f2b5c] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Memuat rekam jejak audit perubahan...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              Belum ada catatan riwayat perubahan keputusan yang tercatat.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/70 transition-colors space-y-2"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">
                      {log.applicantName}
                    </span>{' '}
                    <span className="font-mono text-amber-700 font-semibold">
                      ({log.registrationNumber})
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-slate-500">Perubahan:</span>
                  {log.previousDecision && (
                    <>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono uppercase text-[10px]">
                        {log.previousDecision}
                      </span>
                      <span className="text-slate-400">&rarr;</span>
                    </>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                      log.newDecision === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.newDecision === 'waitlist'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.newDecision === 'accepted' ? 'LULUS DITERIMA' : log.newDecision === 'waitlist' ? 'CADANGAN' : 'TIDAK LULUS'}
                  </span>

                  <span className="text-slate-400">&bull;</span>
                  <span className="text-slate-600">
                    Oleh: <strong className="text-slate-800">{log.changedBy}</strong> {log.changedByEmail ? `(${log.changedByEmail})` : ''}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-slate-700 text-[11px]">
                  <strong>Alasan:</strong> {log.reason}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
