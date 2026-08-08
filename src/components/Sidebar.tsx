import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Staff } from '../types';
import { Mic, BookOpen, BarChart3, Settings as SettingsIcon, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

export type ActiveTab = 'capture' | 'register' | 'insights' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentStaff: Staff;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentStaff, isOpen }) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'capture'  as ActiveTab, label: t('nav.capture'),  icon: Mic,         desc: 'Voice capture' },
    { id: 'register' as ActiveTab, label: t('nav.register'), icon: BookOpen,     desc: 'OPD register' },
    { id: 'insights' as ActiveTab, label: t('nav.insights'), icon: BarChart3,    desc: 'Shift metrics' },
    { id: 'settings' as ActiveTab, label: t('nav.settings'), icon: SettingsIcon, desc: 'Preferences' },
  ];

  return (
    <aside
      className="
        fixed md:static inset-y-0 left-0 z-30
        w-64 flex flex-col shrink-0
        transition-transform duration-300 ease-out
        md:translate-x-0
        no-print
      "
      style={{
        background: 'linear-gradient(175deg, #0c5560 0%, #0d5c63 40%, #0a4f56 100%)',
        transform: isOpen ? 'translateX(0)' : undefined,
        boxShadow: isOpen
          ? '4px 0 32px rgba(0,0,0,0.25)'
          : '4px 0 20px rgba(13,92,99,0.3)',
      }}
      aria-label="Main navigation"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.12)',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2), inset -1px -1px 3px rgba(255,255,255,0.1)',
            }}
          >
            <Zap className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-black tracking-tight" style={{ color: '#5eead4' }}>Med</span>
            <span className="text-xl font-black tracking-tight" style={{ color: '#fbbf24' }}>scribe</span>
          </div>
        </div>

        <p className="text-[11px] font-medium text-teal-200/70 leading-snug">
          {t('app.tagline')}
        </p>

        <div
          className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#99f6e4',
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('app.scope')}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto" role="list">
        <div className="px-3 py-2 text-[9px] font-bold tracking-widest text-teal-300/50 uppercase">
          {t('nav.workspace')}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              role="listitem"
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.08) 100%)',
                      boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'white',
                    }
                  : {
                      color: 'rgba(255,255,255,0.6)',
                      border: '1px solid transparent',
                    }
              }
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className="w-4 h-4 shrink-0 transition-colors"
                style={{ color: isActive ? '#5eead4' : 'rgba(255,255,255,0.5)' }}
              />
              <div className="text-left overflow-hidden">
                <div className="font-semibold leading-none">{item.label}</div>
                <div
                  className="text-[10px] mt-0.5 truncate"
                  style={{ color: isActive ? 'rgba(94,234,212,0.8)' : 'rgba(255,255,255,0.35)' }}
                >
                  {item.desc}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Status Block */}
      <div className="p-4 border-t border-white/10 space-y-3">

        {/* Offline status chip */}
        <div
          className="px-3 py-2.5 rounded-xl text-xs space-y-1"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('nav.offlineReady')}</span>
          </div>
          <p className="text-[10px] text-teal-300/60">{t('nav.lastSync')}</p>
        </div>

        {/* Staff badge */}
        <div className="flex items-center gap-2.5 px-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#451a03',
              boxShadow: '0 2px 8px rgba(251,191,36,0.4)',
            }}
          >
            {currentStaff.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">{currentStaff.name}</div>
            <div className="text-[10px] text-teal-300/60 truncate">{currentStaff.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
