import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Staff } from '../types';
import { ShieldCheck, UserCheck, KeyRound, Globe, ArrowRight } from 'lucide-react';

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
      setErrorMsg('Invalid 4-digit PIN. Try 1234.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-baseline gap-0.5">
            <span className="text-3xl font-black text-[#0d5c63]">Med</span>
            <span className="text-3xl font-black text-[#fbbf24]">scribe</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {t('login.heading')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t('login.subheading')}
          </p>
        </div>

        {/* Language Selection Grid (Before Sign In!) */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#0d5c63]" />
            <span>{t('login.iSpeak')}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLocale(lang.code)}
                lang={lang.code}
                className={`p-2 rounded-xl text-xs text-left transition-all border ${
                  locale === lang.code
                    ? 'bg-[#0d5c63] text-white font-bold border-[#09484e] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-extrabold">{lang.nativeLabel}</div>
                <div className="text-[10px] opacity-70">{lang.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Staff Selection & PIN Form */}
        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {t('login.switchUser')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_STAFF_MEMBERS.map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => {
                    setSelectedStaff(staff);
                    setErrorMsg('');
                  }}
                  className={`p-3 rounded-xl text-xs font-semibold text-left border transition-all flex items-center gap-2 ${
                    selectedStaff.id === staff.id
                      ? 'bg-[#0d5c63] text-white border-[#09484e] ring-2 ring-teal-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-[#fbbf24] shrink-0" />
                  <div className="truncate">
                    <div className="font-bold truncate">{staff.name}</div>
                    <div className="text-[10px] text-[#2dd4bf] truncate">{staff.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('login.pinLabel')}</span>
            </label>
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setErrorMsg('');
              }}
              placeholder="1234"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 font-mono text-center text-lg tracking-widest text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0d5c63]"
            />
            {errorMsg && <p className="text-xs text-rose-600 font-bold text-center mt-1">{errorMsg}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#0d5c63] hover:bg-[#09484e] text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span>{t('login.openButton')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Scope Note */}
        <div className="p-3 bg-emerald-950/90 rounded-2xl border border-emerald-800 text-[11px] text-emerald-200 leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{t('login.scopeNote')}</span>
        </div>

      </div>
    </div>
  );
};
