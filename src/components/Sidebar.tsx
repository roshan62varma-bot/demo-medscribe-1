import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Staff } from '../types';
import { Mic, BookOpen, BarChart3, Settings as SettingsIcon, ShieldCheck, CheckCircle2 } from 'lucide-react';

export type ActiveTab = 'capture' | 'register' | 'insights' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentStaff: Staff;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentStaff }) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'capture' as ActiveTab, label: t('nav.capture'), icon: Mic },
    { id: 'register' as ActiveTab, label: t('nav.register'), icon: BookOpen },
    { id: 'insights' as ActiveTab, label: t('nav.insights'), icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: t('nav.settings'), icon: SettingsIcon },
  ];

  return (
    <aside className="w-full md:w-64 bg-[#0d5c63] text-slate-100 flex flex-col border-r border-[#09484e] shrink-0">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-[#0a4d53]">
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-black tracking-tight text-[#2dd4bf]">Med</span>
          <span className="text-2xl font-black tracking-tight text-[#fbbf24]">scribe</span>
        </div>
        <p className="text-xs text-[#99f6e4] font-medium mt-1">
          {t('app.tagline')}
        </p>
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 border border-white/10 text-[11px] text-[#99f6e4] font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#fbbf24]" />
          <span>{t('app.scope')}</span>
        </div>
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-[#99f6e4]/70 uppercase">
          {t('nav.workspace')}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-md border border-white/20'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#2dd4bf]' : 'text-white/70'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Status Block */}
      <div className="p-4 border-t border-[#0a4d53] space-y-3 bg-[#0a4d53]/50">
        
        {/* Offline & Sync Card */}
        <div className="bg-black/20 border border-white/10 rounded-xl p-3 text-xs space-y-1 text-[#99f6e4]">
          <div className="flex items-center justify-between font-semibold">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-white">{t('nav.offlineReady')}</span>
            </div>
          </div>
          <p className="text-[11px] opacity-80">
            {t('nav.lastSync')}
          </p>
        </div>

        {/* Staff Nurse Badge */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#fbbf24]/20 border border-[#fbbf24]/40 flex items-center justify-center font-bold text-[#fbbf24] text-xs">
            {currentStaff.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-white truncate">{currentStaff.name}</div>
            <div className="text-[10px] text-[#99f6e4] truncate">{currentStaff.role}</div>
          </div>
        </div>

      </div>

    </aside>
  );
};
