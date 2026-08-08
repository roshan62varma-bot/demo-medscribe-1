import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Staff } from '../types';
import { ShieldCheck, UserCheck, KeyRound, Globe, ArrowRight, Zap } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaff: Staff;
  onSelectStaff: (staff: Staff) => void;
}

const DEFAULT_STAFF_MEMBERS: Staff[] = [
  {
    id: 'NURSE-01',
    name: 'Nurse Asha Devi',
    role: 'Staff Nurse / ANM',
    facilityId: 'PHC-01',
    facilityName: 'Primary Health Centre #1',
    pin: '1234',
  },
  {
    id: 'NURSE-02',
    name: 'Sister Sunita Rao',
    role: 'Community Health Officer',
    facilityId: 'PHC-01',
    facilityName: 'Primary Health Centre #1',
    pin: '5678',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentStaff,
  onSelectStaff,
}) => {
  const { t, locale, setLocale, SUPPORTED_LANGUAGES } = useLanguage();
  const [selectedStaff, setSelectedStaff] = useState<Staff>(currentStaff);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === selectedStaff.pin || pinInput === '1234') {
      onSelectStaff(selectedStaff);
      onClose();
    } else {
      setErrorMsg('Invalid PIN. Try 1234.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,30,40,0.75)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full max-w-md animate-scale-in overflow-y-auto"
        style={{
          background: 'var(--neo-bg)',
          boxShadow: 'var(--neo-shadow-lg)',
          borderRadius: '1.5rem',
          maxHeight: '90dvh',
        }}
      >
        <div className="p-6 sm:p-8 space-y-6">

          {/* Header */}
          <div className="text-center space-y-3">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #0c5560, #0d5c63)',
                boxShadow: '5px 5px 14px rgba(13,92,99,0.4), -3px -3px 8px rgba(255,255,255,0.6)',
              }}
            >
              <Zap className="w-5 h-5 text-amber-300" />
              <span className="text-xl font-black" style={{ color: '#5eead4' }}>Med</span>
              <span className="text-xl font-black" style={{ color: '#fbbf24' }}>scribe</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">{t('login.heading')}</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              {t('login.subheading')}
            </p>
          </div>

          {/* Language Grid */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Globe className="w-3.5 h-3.5" style={{ color: 'var(--teal)' }} />
              <span>{t('login.iSpeak')}</span>
            </div>
            <div
              className="p-2 rounded-xl max-h-36 overflow-y-auto"
              style={{ boxShadow: 'var(--neo-shadow-inset)', background: 'var(--neo-bg)' }}
            >
              <div className="grid grid-cols-3 gap-1.5">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLocale(lang.code)}
                    lang={lang.code}
                    className="p-2 rounded-lg text-xs text-left transition-all"
                    style={
                      locale === lang.code
                        ? {
                            background: 'linear-gradient(135deg, #0f6b73, #0d5c63)',
                            color: 'white',
                            boxShadow: '3px 3px 8px rgba(13,92,99,0.35), -2px -2px 5px rgba(255,255,255,0.5)',
                          }
                        : {
                            background: 'var(--neo-bg)',
                            color: 'var(--text-secondary)',
                            boxShadow: 'var(--neo-shadow-sm)',
                          }
                    }
                  >
                    <div className="font-bold truncate">{lang.nativeLabel}</div>
                    <div className="text-[9px] opacity-60 mt-0.5 truncate">{lang.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Staff + PIN */}
          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                {t('login.switchUser')}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {DEFAULT_STAFF_MEMBERS.map((staff) => (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => { setSelectedStaff(staff); setErrorMsg(''); }}
                    className="p-3 rounded-xl text-xs text-left transition-all flex items-center gap-2"
                    style={
                      selectedStaff.id === staff.id
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
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                      style={{
                        background: selectedStaff.id === staff.id
                          ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        color: selectedStaff.id === staff.id ? 'white' : '#451a03',
                      }}
                    >
                      {staff.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold truncate">{staff.name.split(' ').slice(0, 2).join(' ')}</div>
                      <div
                        className="text-[9px] truncate"
                        style={{ color: selectedStaff.id === staff.id ? 'rgba(94,234,212,0.8)' : 'var(--text-muted)' }}
                      >
                        {staff.role}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('login.pinLabel')}</span>
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setErrorMsg(''); }}
                placeholder="• • • •"
                className="neo-input w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono font-bold text-slate-800"
              />
              {errorMsg && (
                <p className="text-xs text-rose-600 font-semibold text-center mt-1.5">{errorMsg}</p>
              )}
            </div>

            <button
              type="submit"
              className="neo-btn-primary w-full py-3.5 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              <span>{t('login.openButton')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Scope note */}
          <div
            className="p-3.5 rounded-xl flex items-start gap-2.5"
            style={{
              background: 'linear-gradient(135deg, #0c3d42, #0d4a50)',
              boxShadow: '3px 3px 10px rgba(13,92,99,0.3)',
            }}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-[11px] text-teal-200/80 leading-relaxed">{t('login.scopeNote')}</span>
          </div>

        </div>
      </div>
    </div>
  );
};
