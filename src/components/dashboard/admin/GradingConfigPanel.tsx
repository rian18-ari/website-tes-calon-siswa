import React, { useEffect, useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Save,
  HelpCircle,
  Clock,
  Shuffle,
  Eye,
  Award,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { SystemGradingConfig, TestCategory } from '../../../types/ppdb';
import {
  getSystemGradingConfig,
  saveSystemGradingConfig,
  saveTestCategory,
} from '../../../services/ppdbService';

interface GradingConfigPanelProps {
  categories: TestCategory[];
  onCategoriesUpdated: () => void;
}

export const GradingConfigPanel: React.FC<GradingConfigPanelProps> = ({
  categories,
  onCategoriesUpdated,
}) => {
  const [config, setConfig] = useState<SystemGradingConfig>({
    id: 'gradingPolicy',
    totalWeight: 100,
    aggregatePassingGrade: 75,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowDirectResultView: false,
    scoringPolicy: 'standard',
    defaultDurationMinutes: 90,
    sampleQuestionCount: 30,
  });

  const [categoryWeights, setCategoryWeights] = useState<Record<string, number>>({});
  const [categoryPassingGrades, setCategoryPassingGrades] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const data = await getSystemGradingConfig();
        setConfig(data);

        // Map weights from categories
        const weightMap: Record<string, number> = {};
        const passingMap: Record<string, number> = {};
        categories.forEach((cat) => {
          weightMap[cat.id] = cat.weight || 0;
          passingMap[cat.id] = cat.passingGrade || 75;
        });
        setCategoryWeights(weightMap);
        setCategoryPassingGrades(passingMap);
      } catch (err) {
        console.error('Error loading grading config', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [categories]);

  // Calculate total active weight
  const activeCategories = categories.filter((c) => c.isActive !== false);
  const currentTotalWeight = activeCategories.reduce((sum, cat) => {
    return sum + (categoryWeights[cat.id] !== undefined ? categoryWeights[cat.id] : cat.weight);
  }, 0);

  const isWeightValid = currentTotalWeight === 100;

  const handleWeightChange = (catId: string, val: number) => {
    setCategoryWeights((prev) => ({
      ...prev,
      [catId]: val,
    }));
  };

  const handlePassingGradeChange = (catId: string, val: number) => {
    setCategoryPassingGrades((prev) => ({
      ...prev,
      [catId]: val,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(false);

    if (!isWeightValid) {
      setError(`Total bobot kategori aktif saat ini adalah ${currentTotalWeight}%. Bobot harus berjumlah tepat 100%.`);
      return;
    }

    setSaving(true);
    try {
      // 1. Save system config
      await saveSystemGradingConfig({
        ...config,
        totalWeight: currentTotalWeight,
      });

      // 2. Update category weights in Firestore
      for (const cat of categories) {
        const newWeight = categoryWeights[cat.id];
        const newPassing = categoryPassingGrades[cat.id];
        if (newWeight !== undefined || newPassing !== undefined) {
          await saveTestCategory({
            ...cat,
            weight: newWeight !== undefined ? newWeight : cat.weight,
            passingGrade: newPassing !== undefined ? newPassing : cat.passingGrade,
          });
        }
      }

      setSaving(false);
      setSavedSuccess(true);
      onCategoriesUpdated();
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setSaving(false);
      setError(err.message || 'Gagal menyimpan konfigurasi penilaian.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-600 mb-2" />
        Memuat konfigurasi penilaian...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-600" />
            Konfigurasi Penilaian & Kebijakan Seleksi PPDB
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur bobot persentase kategori, ambang batas kelulusan (passing grade), pengacakan, dan aturan skor.
          </p>
        </div>

        {/* Live Total Weight Badge */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold shadow-xs ${
            isWeightValid
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900 animate-pulse'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Total Bobot Aktif:</span>
          <span className="text-sm font-extrabold">{currentTotalWeight}%</span>
          {isWeightValid ? (
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full font-bold">
              Valid (100%)
            </span>
          ) : (
            <span className="text-[10px] bg-red-200 text-red-900 px-1.5 py-0.5 rounded-full font-bold">
              Harus 100%
            </span>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">
            Konfigurasi penilaian dan pembobotan kategori berhasil disimpan ke sistem!
          </span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Category Weights & Passing Grades */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              1. Pembobotan & Passing Grade (KKM) per Kategori
            </h4>
            <span className="text-[11px] text-slate-500">
              Total seluruh kategori aktif wajib bernilai 100%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const currentW = categoryWeights[cat.id] !== undefined ? categoryWeights[cat.id] : cat.weight;
              const currentP = categoryPassingGrades[cat.id] !== undefined ? categoryPassingGrades[cat.id] : cat.passingGrade;
              const isActive = cat.isActive !== false;

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-white border-slate-200 shadow-xs'
                      : 'bg-slate-100/60 border-dashed border-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {cat.code}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 mt-1">{cat.name}</h5>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      Tipe: {cat.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Bobot Persentase (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={!isActive}
                        value={currentW}
                        onChange={(e) => handleWeightChange(cat.id, Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs font-bold text-[#0f2b5c] bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0f2b5c] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Passing Grade (KKM)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={!isActive}
                        value={currentP}
                        onChange={(e) => handlePassingGradeChange(cat.id, Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs font-bold text-emerald-700 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Global Exam Rules & Policy */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-amber-600" />
            2. Parameter Pelaksanaan Ujian & Sistem Penilaian
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Global Passing Grade */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Passing Grade Agregat *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.aggregatePassingGrade}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, aggregatePassingGrade: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 text-xs font-bold text-emerald-700 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Skor total tertimbang minimum kelulusan santri.
              </span>
            </div>

            {/* Questions Sample Count */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jumlah Soal per Sesi *
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={config.sampleQuestionCount}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, sampleQuestionCount: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 text-xs font-bold text-[#0f2b5c] bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Diambil acak dari bank soal saat sesi CBT santri.
              </span>
            </div>

            {/* Standard Duration */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Durasi Standar (Menit) *
              </label>
              <input
                type="number"
                min="15"
                max="300"
                value={config.defaultDurationMinutes}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, defaultDurationMinutes: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 text-xs font-bold text-[#0f2b5c] bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Batas waktu default tes komputer santri.
              </span>
            </div>
          </div>

          {/* Scoring Policy (Standard vs Minus) */}
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Kebijakan Penilaian Jawaban Salah & Kosong
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer text-xs flex items-start gap-3 transition-all ${
                  config.scoringPolicy === 'standard'
                    ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="scoringPolicy"
                  checked={config.scoringPolicy === 'standard'}
                  onChange={() => setConfig((prev) => ({ ...prev, scoringPolicy: 'standard' }))}
                  className="mt-0.5 text-[#0f2b5c]"
                />
                <div>
                  <div className="font-bold text-slate-900">Standar (Tanpa Penalti)</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Jawaban benar mendapat poin penuh, jawaban salah atau kosong mendapat nilai 0.
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer text-xs flex items-start gap-3 transition-all ${
                  config.scoringPolicy === 'penalty'
                    ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-400'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="scoringPolicy"
                  checked={config.scoringPolicy === 'penalty'}
                  onChange={() => setConfig((prev) => ({ ...prev, scoringPolicy: 'penalty' }))}
                  className="mt-0.5 text-amber-600"
                />
                <div>
                  <div className="font-bold text-slate-900">Sistem Penalti (Minus Satu)</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Jawaban salah mengurangi 1 poin (-1), jawaban kosong 0 poin.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Randomization and Direct Result view toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={config.shuffleQuestions}
                onChange={(e) => setConfig((prev) => ({ ...prev, shuffleQuestions: e.target.checked }))}
                className="w-4 h-4 text-[#0f2b5c] rounded focus:ring-[#0f2b5c]"
              />
              <span className="font-medium text-slate-800">Acak Urutan Soal CBT</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={config.shuffleOptions}
                onChange={(e) => setConfig((prev) => ({ ...prev, shuffleOptions: e.target.checked }))}
                className="w-4 h-4 text-[#0f2b5c] rounded focus:ring-[#0f2b5c]"
              />
              <span className="font-medium text-slate-800">Acak Pilihan Jawaban (A-D)</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={config.allowDirectResultView}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, allowDirectResultView: e.target.checked }))
                }
                className="w-4 h-4 text-[#0f2b5c] rounded focus:ring-[#0f2b5c]"
              />
              <span className="font-medium text-slate-800">Santri Langsung Lihat Nilai</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !isWeightValid}
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#0f2b5c] hover:bg-[#153a7a] rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                Menyimpan Konfigurasi...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-amber-300" />
                Simpan Konfigurasi Penilaian
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
