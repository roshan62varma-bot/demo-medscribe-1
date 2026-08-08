import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ClinicalNote } from '../types';
import { getHandwrittenBaseline } from '../lib/offlineStore';
import { TrendingUp, Clock, CheckCircle2, PieChart, Info } from 'lucide-react';

interface InsightsViewProps {
  signedNotes: ClinicalNote[];
}

export const InsightsView: React.FC<InsightsViewProps> = ({ signedNotes }) => {
  const { t } = useLanguage();
  const baselineSeconds = getHandwrittenBaseline();
  const totalSigned = signedNotes.length;

  const uneditedCount = signedNotes.filter((n) => !n.amendments || n.amendments.length === 0).length;
  const uneditedPercent = totalSigned > 0 ? Math.round((uneditedCount / totalSigned) * 100) : 100;

  const avgLatencyMs =
    signedNotes.length > 0
      ? signedNotes.reduce((acc, n) => acc + (n.latency_ms || 1200), 0) / signedNotes.length
      : 1200;

  const actualSecondsPerNote = Math.round(avgLatencyMs / 100) / 10 + 15;
  const secondsSavedPerNote = Math.max(0, baselineSeconds - actualSecondsPerNote);
  const totalMinutesSavedToday = ((secondsSavedPerNote * totalSigned) / 60).toFixed(1);

  const categoriesMap: Record<string, number> = {};
  signedNotes.forEach((n) => {
    const cat = n.clinical_note?.register_category || 'OPD_GENERAL';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
  });

  const kpiCards = [
    {
      label: t('insights.medianCapture'),
      value: `${actualSecondsPerNote.toFixed(1)} s`,
      sub: t('insights.downFromBaseline', { seconds: Math.round(secondsSavedPerNote) }),
      icon: Clock,
      color: 'var(--teal)',
      accent: 'rgba(13,92,99,0.08)',
    },
    {
      label: t('insights.signedWithoutEdit'),
      value: `${uneditedPercent}%`,
      sub: t('insights.honestSignal'),
      icon: CheckCircle2,
      color: '#059669',
      accent: 'rgba(5,150,105,0.08)',
    },
    {
      label: t('insights.timeReturned'),
      value: `${totalMinutesSavedToday} min`,
      sub: t('insights.comparedBaseline', { baseline: baselineSeconds }),
      icon: TrendingUp,
      color: '#d97706',
      accent: 'rgba(217,119,6,0.08)',
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--teal)' }}>
          {t('insights.breadcrumb')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-display text-slate-800">{t('insights.heading')}</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">{t('insights.subheading')}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="neo-card p-5 space-y-3"
              style={{ background: card.accent }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-snug max-w-[80%]">
                  {card.label}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-sm)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <div className="text-3xl font-black font-mono" style={{ color: card.color }}>{card.value}</div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom row: Doc mix + Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Documentation mix */}
        <div className="neo-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
              <PieChart className="w-4 h-4" style={{ color: 'var(--teal)' }} />
              {t('insights.docMix')}
            </div>
            <span className="text-xs text-slate-400">{t('insights.whatReachedBook')}</span>
          </div>

          {Object.keys(categoriesMap).length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center">No signed entries recorded yet today.</div>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(categoriesMap).map(([cat, count]) => {
                const pct = Math.round((count / totalSigned) * 100);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{cat.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-inset)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, var(--teal), #2dd4bf)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Guidance card */}
        <div
          className="p-5 rounded-2xl space-y-4 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(160deg, #0c3d42, #0a3038)',
            boxShadow: '8px 8px 20px rgba(13,92,99,0.4), -4px -4px 12px rgba(255,255,255,0.1)',
          }}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
              <Info className="w-4 h-4" />
              <span>Operational Guidance</span>
            </div>
            <p className="text-sm text-teal-200/80 leading-relaxed">{t('insights.priorityNote')}</p>
          </div>

          <div
            className="p-3.5 rounded-xl text-xs font-mono space-y-1"
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#5eead4',
            }}
          >
            <div>Baseline: {baselineSeconds}s / line</div>
            <div>Average:  {actualSecondsPerNote.toFixed(1)}s / line</div>
            <div>Factor:   {(baselineSeconds / (actualSecondsPerNote || 1)).toFixed(1)}×</div>
          </div>
        </div>
      </div>
    </div>
  );
};
