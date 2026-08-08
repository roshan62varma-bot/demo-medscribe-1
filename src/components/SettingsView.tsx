import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { getHandwrittenBaseline, setHandwrittenBaseline } from '../lib/offlineStore';
import {
  Globe,
  Volume2,
  VolumeX,
  Wifi,
  Clock,
  ShieldAlert,
  Check
} from 'lucide-react';

interface SettingsViewProps {
  voiceFeedbackEnabled: boolean;
  setVoiceFeedbackEnabled: (enabled: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  voiceFeedbackEnabled,
  setVoiceFeedbackEnabled,
}) => {
  const { locale, setLocale, SUPPORTED_LANGUAGES, t } = useLanguage();
  const [baselineSeconds, setBaselineSec] = useState<number>(getHandwrittenBaseline());
  const [savedBaselineToast, setSavedBaselineToast] = useState(false);

  const handleBaselineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setBaselineSec(val);
      setHandwrittenBaseline(val);
      setSavedBaselineToast(true);
      setTimeout(() => setSavedBaselineToast(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="border-b border-emerald-900/30 pb-4">
        <div className="text-[11px] font-bold tracking-widest text-teal-700 dark:text-teal-400 uppercase">
          {t('settings.breadcrumb')}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
          {t('settings.heading')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
          {t('settings.subheading')}
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Language Selection Grid */}
        <div className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Globe className="w-5 h-5 text-teal-600" />
              <span>{t('settings.captureLanguage')}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('settings.captureLanguageDesc')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2" role="radiogroup" aria-label="Capture language">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setLocale(lang.code)}
                  lang={lang.code}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'bg-[#0d5c63] text-white border-[#09484e] ring-2 ring-teal-500/30 shadow-md font-bold'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-sm font-extrabold">{lang.nativeLabel}</div>
                  <div className={`text-[10px] mt-0.5 ${isActive ? 'text-teal-200' : 'text-slate-400'}`}>
                    {lang.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice Feedback Toggle */}
        <div className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              {voiceFeedbackEnabled ? <Volume2 className="w-5 h-5 text-teal-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
              <span>{t('settings.voiceFeedback')}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('settings.voiceFeedbackDesc')}
            </p>
          </div>

          <button
            onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
              voiceFeedbackEnabled
                ? 'bg-teal-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {voiceFeedbackEnabled ? t('settings.voiceOn') : t('settings.voiceOff')}
          </button>
        </div>

        {/* Offline Status */}
        <div className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Wifi className="w-5 h-5 text-teal-600" />
              <span>{t('settings.offlineStatus')}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('settings.offlineStatusDesc')}
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            {t('settings.readyOffline')}
          </span>
        </div>

        {/* Handwritten Baseline Calibration */}
        <div className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>{t('settings.baseline')}</span>
            </div>
            {savedBaselineToast && (
              <span className="text-xs text-teal-600 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('settings.baselineDesc')}
          </p>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="number"
              value={baselineSeconds}
              onChange={handleBaselineChange}
              className="w-28 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t('settings.baselineUnit')}
            </span>
          </div>
        </div>

        {/* Medscribe Scope Wall Card */}
        <div className="bg-emerald-950 text-slate-100 p-6 rounded-2xl border border-emerald-800 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5" />
            <span>{t('settings.scopeWall')}</span>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            {t('settings.scopeWallDesc')}
          </p>
        </div>

      </div>

    </div>
  );
};
