import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ClinicalNote } from '../types';
import { getHandwrittenBaseline } from '../lib/offlineStore';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  PieChart,
  BarChart2,
  ShieldAlert,
  Info
} from 'lucide-react';

interface InsightsViewProps {
  signedNotes: ClinicalNote[];
}

export const InsightsView: React.FC<InsightsViewProps> = ({ signedNotes }) => {
  const { t } = useLanguage();
  const baselineSeconds = getHandwrittenBaseline();

  const totalSigned = signedNotes.length;

  // Calculate unedited notes percentage
  const uneditedCount = signedNotes.filter((n) => !n.amendments || n.amendments.length === 0).length;
  const uneditedPercent = totalSigned > 0 ? Math.round((uneditedCount / totalSigned) * 100) : 100;

  // Calculate average capture-to-sign latency
  const avgLatencyMs =
    signedNotes.length > 0
      ? signedNotes.reduce((acc, n) => acc + (n.latency_ms || 1200), 0) / signedNotes.length
      : 1200;

  const actualSecondsPerNote = Math.round(avgLatencyMs / 100) / 10 + 15; // Average capture + review time (~25s)
  const secondsSavedPerNote = Math.max(0, baselineSeconds - actualSecondsPerNote);
  const totalSecondsSavedToday = Math.round(secondsSavedPerNote * totalSigned);
  const totalMinutesSavedToday = (totalSecondsSavedToday / 60).toFixed(1);

  // Category Breakdown
  const categoriesMap: Record<string, number> = {};
  signedNotes.forEach((n) => {
    const cat = n.clinical_note?.register_category || 'OPD_GENERAL';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="border-b border-emerald-900/30 pb-4">
        <div className="text-[11px] font-bold tracking-widest text-[#0d5c63] dark:text-teal-400 uppercase">
          {t('insights.breadcrumb')}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
          {t('insights.heading')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
          {t('insights.subheading')}
        </p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Median Capture to Sign */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('insights.medianCapture')}</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {actualSecondsPerNote.toFixed(1)} s
          </div>
          <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold">
            {t('insights.downFromBaseline', { seconds: Math.round(secondsSavedPerNote) })}
          </p>
        </div>

        {/* Signed Without Edit */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('insights.signedWithoutEdit')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {uneditedPercent}%
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {t('insights.honestSignal')}
          </p>
        </div>

        {/* Time Returned Today */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('insights.timeReturned')}</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {totalMinutesSavedToday} mins
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {t('insights.comparedBaseline', { baseline: baselineSeconds })}
          </p>
        </div>

      </div>

      {/* Category Breakdown & Shift Pace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Documentation Mix */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
              <PieChart className="w-4 h-4 text-teal-600" />
              <span>{t('insights.docMix')}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{t('insights.whatReachedBook')}</span>
          </div>

          <div className="space-y-3">
            {Object.keys(categoriesMap).length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No signed entries recorded yet today.</div>
            ) : (
              Object.entries(categoriesMap).map(([cat, count]) => {
                const pct = Math.round((count / totalSigned) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>{cat.replace(/_/g, ' ')}</span>
                      <span className="font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Priority Ordering Aid Disclaimer */}
        <div className="bg-emerald-950 text-slate-100 p-6 rounded-2xl border border-emerald-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Info className="w-5 h-5" />
              <span>Operational Guidance</span>
            </div>
            <p className="text-sm text-emerald-200/90 leading-relaxed">
              {t('insights.priorityNote')}
            </p>
          </div>

          <div className="p-3 bg-emerald-900/60 rounded-xl border border-emerald-800 text-xs font-mono text-emerald-300">
            <div>Measured Baseline: {baselineSeconds}s / line</div>
            <div>Measured Average: {actualSecondsPerNote.toFixed(1)}s / line</div>
            <div>Efficiency Factor: {((baselineSeconds / (actualSecondsPerNote || 1))).toFixed(1)}x</div>
          </div>
        </div>

      </div>

    </div>
  );
};
