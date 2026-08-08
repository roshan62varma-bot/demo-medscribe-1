import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { getHandwrittenBaseline, setHandwrittenBaseline } from '../lib/offlineStore';
import { Globe, Volume2, VolumeX, Wifi, Clock, ShieldAlert, Check } from 'lucide-react';

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
  const [savedToast, setSavedToast] = useState(false);

  const handleBaselineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setBaselineSec(val);
      setHandwrittenBaseline(val);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--teal)' }}>
          {t('settings.breadcrumb')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-display text-slate-800">{t('settings.heading')}</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">{t('settings.subheading')}</p>
      </div>

      {/* Language selection */}
      <div className="neo-card p-5 sm:p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-1">
            <Globe className="w-4 h-4" style={{ color: 'var(--teal)' }} />
            {t('settings.captureLanguage')}
          </div>
          <p className="text-xs text-slate-500">{t('settings.captureLanguageDesc')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Capture language">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = locale === lang.code;
            return (
              <button
                key={lang.code}
                role="radio"
                aria-checked={isActive}
                onClick={() => setLocale(lang.code)}
                lang={lang.code}
                className="p-3 rounded-xl text-left transition-all"
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(135deg, #0f6b73, #0d5c63)',
                        color: 'white',
                        boxShadow: '5px 5px 12px rgba(13,92,99,0.4), -3px -3px 8px rgba(255,255,255,0.5)',
                      }
                    : {
                        background: 'var(--neo-bg)',
                        color: 'var(--text-secondary)',
                        boxShadow: 'var(--neo-shadow-sm)',
                      }
                }
              >
                <div className="text-sm font-bold">{lang.nativeLabel}</div>
                <div className="text-[10px] mt-0.5 opacity-70">{lang.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice feedback */}
      <div className="neo-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-1">
            {voiceFeedbackEnabled
              ? <Volume2 className="w-4 h-4 text-emerald-600" />
              : <VolumeX className="w-4 h-4 text-slate-400" />
            }
            {t('settings.voiceFeedback')}
          </div>
          <p className="text-xs text-slate-500">{t('settings.voiceFeedbackDesc')}</p>
        </div>
        <button
          onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0"
          style={
            voiceFeedbackEnabled
              ? {
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: 'white',
                  boxShadow: '4px 4px 10px rgba(5,150,105,0.3), -2px -2px 6px rgba(255,255,255,0.6)',
                }
              : {
                  background: 'var(--neo-bg)',
                  color: 'var(--text-muted)',
                  boxShadow: 'var(--neo-shadow-sm)',
                }
          }
        >
          {voiceFeedbackEnabled ? t('settings.voiceOn') : t('settings.voiceOff')}
        </button>
      </div>

      {/* Offline status */}
      <div className="neo-card p-5 sm:p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-1">
            <Wifi className="w-4 h-4 text-emerald-600" />
            {t('settings.offlineStatus')}
          </div>
          <p className="text-xs text-slate-500">{t('settings.offlineStatusDesc')}</p>
        </div>
        <span
          className="px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{
            background: 'rgba(5,150,105,0.1)',
            color: '#065f46',
            boxShadow: 'var(--neo-shadow-sm)',
          }}
        >
          {t('settings.readyOffline')}
        </span>
      </div>

      {/* Baseline calibration */}
      <div className="neo-card p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
            <Clock className="w-4 h-4 text-amber-500" />
            {t('settings.baseline')}
          </div>
          {savedToast && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">{t('settings.baselineDesc')}</p>
        <div className="flex items-center gap-3 pt-1">
          <input
            type="number"
            value={baselineSeconds}
            onChange={handleBaselineChange}
            className="neo-input w-28 px-3 py-2 text-sm font-bold font-mono text-slate-800"
          />
          <span className="text-xs text-slate-500">{t('settings.baselineUnit')}</span>
        </div>
      </div>

      {/* Scope wall */}
      <div
        className="p-5 sm:p-6 rounded-2xl space-y-3"
        style={{
          background: 'linear-gradient(160deg, #0c3d42, #0a3038)',
          boxShadow: '8px 8px 20px rgba(13,92,99,0.4), -4px -4px 12px rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
          <ShieldAlert className="w-5 h-5" />
          {t('settings.scopeWall')}
        </div>
        <p className="text-sm text-teal-200/80 leading-relaxed">{t('settings.scopeWallDesc')}</p>
      </div>

    </div>
  );
};
