import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { ClinicalNote, Staff } from './types';
import { getLocalSignedNotes, saveLocalSignedNote } from './lib/offlineStore';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { CaptureView } from './components/CaptureView';
import { RegisterView } from './components/RegisterView';
import { InsightsView } from './components/InsightsView';
import { SettingsView } from './components/SettingsView';
import { RegisterChatbot } from './components/RegisterChatbot';
import { AuthModal } from './components/AuthModal';

const DEFAULT_STAFF: Staff = {
  id: 'NURSE-01',
  name: 'Nurse Asha Devi',
  role: 'Staff Nurse / ANM',
  facilityId: 'PHC-01',
  facilityName: 'Primary Health Centre #1',
  pin: '1234',
};

function MedscribeApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('capture');
  const [currentStaff, setCurrentStaff] = useState<Staff>(DEFAULT_STAFF);
  const [signedNotes, setSignedNotes] = useState<ClinicalNote[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close sidebar on tab change (mobile)
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Fetch signed register notes on mount
  useEffect(() => {
    async function loadRegister() {
      try {
        const res = await fetch('/api/register');
        if (res.ok) {
          const data = await res.json();
          if (data.lines && Array.isArray(data.lines)) {
            const fetchedNotes: ClinicalNote[] = data.lines.map((item: any) => ({
              note_id: item.note_id,
              created_at: item.created_at,
              status: 'SIGNED',
              signed_at: item.signed_at,
              raw_input: item.raw_input || '',
              urgency: item.urgency,
              next_step: item.next_step,
              nurse_id: item.nurse_id,
              facility_id: item.facility_id,
              amendments: item.amendments || [],
              ...item.payload,
            }));
            setSignedNotes(fetchedNotes);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load server register, loading local store:', e);
      }
      const local = getLocalSignedNotes();
      setSignedNotes(local);
    }
    loadRegister();
  }, []);

  const handleNoteSigned = (newNote: ClinicalNote) => {
    setSignedNotes((prev) => [newNote, ...prev.filter((n) => n.note_id !== newNote.note_id)]);
    saveLocalSignedNote(newNote);
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--neo-bg)' }}>

      {/* Top Header */}
      <Header
        currentStaff={currentStaff}
        onOpenAuth={() => setAuthModalOpen(true)}
        isOnline={isOnline}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex relative overflow-hidden">

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          currentStaff={currentStaff}
          isOpen={sidebarOpen}
        />

        {/* Main Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-[1200px] mx-auto">
            {activeTab === 'capture' && (
              <CaptureView
                currentStaff={currentStaff}
                onNoteSigned={handleNoteSigned}
                recentSignedNotes={signedNotes}
                onNavigateToRegister={() => handleTabChange('register')}
              />
            )}
            {activeTab === 'register' && (
              <RegisterView
                signedNotes={signedNotes}
                onOpenChatbot={() => setChatbotOpen(true)}
              />
            )}
            {activeTab === 'insights' && (
              <InsightsView signedNotes={signedNotes} />
            )}
            {activeTab === 'settings' && (
              <SettingsView
                voiceFeedbackEnabled={voiceFeedbackEnabled}
                setVoiceFeedbackEnabled={setVoiceFeedbackEnabled}
              />
            )}
          </div>
        </main>
      </div>

      {/* Register Assistant Chatbot Panel */}
      <RegisterChatbot
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
      />

      {/* Authentication / Staff Switcher Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentStaff={currentStaff}
        onSelectStaff={setCurrentStaff}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MedscribeApp />
    </LanguageProvider>
  );
}
