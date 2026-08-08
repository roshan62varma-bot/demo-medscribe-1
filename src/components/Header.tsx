import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Staff } from '../types';
import { Globe, Wifi, WifiOff, User, ChevronDown, Menu, X } from 'lucide-react';

interface HeaderProps {
  currentStaff: Staff;
  onOpenAuth: () => void;
  isOnline: boolean;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentStaff,
  onOpenAuth,
  isOnline,
  onToggleSidebar,
  sidebarOpen,
}) => {
  const { locale, setLocale, SUPPORTED_LANGUAGES, t, langMeta } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 no-print"
      style={{
        background: 'var(--neo-bg)',
        boxShadow: '0 2px 12px rgba(163,177,198,0.45), 0 -1px 0 rgba(255,255,255,0.9)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

        {/* Left: Hamburger (mobile) + Brand */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden neo-btn w-9 h-9 flex items-center justify-center text-slate-600"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>

          {/* Brand (desktop — sidebar has its own) */}
          <div className="hidden md:flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: 'rgba(13,92,99,0.08)',
                boxShadow: 'inset 2px 2px 4px rgba(163,177,198,0.3), inset -1px -1px 3px rgba(255,255,255,0.8)',
                color: 'var(--teal)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: 'var(--teal)' }}
              />
              <span>{currentStaff.facilityName}</span>
            </div>
          </div>

          {/* Mobile brand */}
          <div className="md:hidden flex items-baseline gap-0.5">
            <span className="text-lg font-black" style={{ color: 'var(--teal)' }}>Med</span>
            <span className="text-lg font-black" style={{ color: 'var(--amber)' }}>scribe</span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">

          {/* Network Status */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold neo-card-sm"
            style={{ color: isOnline ? '#065f46' : '#92400e' }}
          >
            {isOnline
              ? <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              : <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            }
            <span>{isOnline ? t('offline.ready') : 'Offline'}</span>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="neo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
              style={{ color: 'var(--teal)' }}
              aria-label="Select language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{langMeta.nativeLabel}</span>
              <ChevronDown
                className="w-3 h-3 transition-transform duration-200"
                style={{ transform: langMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {langMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangMenuOpen(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-72 z-50 p-3 animate-scale-in"
                  style={{
                    background: 'var(--neo-bg)',
                    boxShadow: 'var(--neo-shadow-lg)',
                    borderRadius: '1rem',
                  }}
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
                    {t('settings.captureLanguage')}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLocale(lang.code); setLangMenuOpen(false); }}
                        className="text-left px-2.5 py-2 rounded-xl text-xs font-semibold transition-all"
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
                        lang={lang.code}
                      >
                        <div className="font-bold">{lang.nativeLabel}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{lang.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Staff / Auth Button */}
          <button
            onClick={onOpenAuth}
            className="neo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
            style={{ color: '#92400e' }}
            title="Switch staff member"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#451a03',
                boxShadow: '2px 2px 5px rgba(245,158,11,0.4)',
              }}
            >
              {currentStaff.name.charAt(0)}
            </div>
            <span className="hidden sm:inline max-w-28 truncate">{currentStaff.name}</span>
          </button>

        </div>
      </div>
    </header>
  );
};
