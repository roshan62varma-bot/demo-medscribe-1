import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Staff } from '../types';
import { Globe, Wifi, WifiOff, User, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentStaff: Staff;
  onOpenAuth: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentStaff, onOpenAuth, isOnline }) => {
  const { locale, setLocale, SUPPORTED_LANGUAGES, t, langMeta } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  return (
    <header className="bg-white/70 text-slate-800 border-b border-slate-200 sticky top-0 z-30 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand logo for mobile / compact layout */}
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-baseline">
            <span className="text-xl font-black tracking-tight text-[#0d5c63]">Med</span>
            <span className="text-xl font-black tracking-tight text-[#d97706]">scribe</span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-[#0d5c63] bg-[#0d5c63]/10 px-3 py-1.5 rounded-full border border-[#0d5c63]/20">
            <span className="w-2 h-2 rounded-full bg-[#0d5c63] animate-pulse"></span>
            <span>{currentStaff.facilityName}</span>
          </div>
        </div>

        {/* Right Action Controls: Language Switcher, Network Status, User Profile */}
        <div className="flex items-center gap-2.5">
          
          {/* Network Status Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
            <span>{isOnline ? t('offline.ready') : 'Offline Mode'}</span>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100/80 text-[#0d5c63] px-3.5 py-1.5 rounded-lg border border-teal-200 text-xs font-bold transition-colors shadow-xs"
              aria-label="Select language"
            >
              <Globe className="w-3.5 h-3.5 text-[#0d5c63]" />
              <span>{langMeta.nativeLabel}</span>
              <ChevronDown className="w-3 h-3 text-[#0d5c63]" />
            </button>

            {langMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 grid grid-cols-2 gap-1 max-h-80 overflow-y-auto">
                  <div className="col-span-2 px-2 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-100 mb-1 uppercase tracking-wider">
                    {t('settings.captureLanguage')}
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLocale(lang.code);
                        setLangMenuOpen(false);
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex flex-col ${
                        locale === lang.code
                          ? 'bg-[#0d5c63] text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                      lang={lang.code}
                    >
                      <span className="text-xs">{lang.nativeLabel}</span>
                      <span className="text-[10px] opacity-75">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* User Profile Switcher */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-200/80 text-xs font-semibold transition-colors"
            title="Switch staff member"
          >
            <User className="w-3.5 h-3.5 text-[#d97706]" />
            <span className="hidden sm:inline">{currentStaff.name}</span>
          </button>

        </div>

      </div>
    </header>
  );
};
