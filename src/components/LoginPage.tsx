import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Staff } from '../types';
import { Eye, EyeOff, UserPlus, LogIn, Zap, Globe, ShieldCheck, AlertCircle } from 'lucide-react';

// ── Staff registry (in-memory, mirrors server seed) ──────────────────────────
// In production this would be server-validated. For demo, we manage it here.
const STAFF_STORAGE_KEY = 'medscribe_staff_registry_v1';

function loadStaffRegistry(): Staff[] {
  try {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default seed staff
  const defaults: Staff[] = [
    { id: 'NURSE-01', name: 'Nurse Asha Devi',   role: 'Staff Nurse / ANM',        facilityId: 'PHC-01', facilityName: 'Primary Health Centre #1', pin: '1234' },
    { id: 'NURSE-02', name: 'Sister Sunita Rao', role: 'Community Health Officer',  facilityId: 'PHC-01', facilityName: 'Primary Health Centre #1', pin: '5678' },
  ];
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveStaffRegistry(list: Staff[]) {
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(list));
}

interface LoginPageProps {
  onLogin: (staff: Staff) => void;
}

type Mode = 'login' | 'signup';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { locale, setLocale, SUPPORTED_LANGUAGES, t } = useLanguage();

  const [mode, setMode]               = useState<Mode>('login');
  const [staffList]                   = useState<Staff[]>(loadStaffRegistry);

  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin]           = useState('');
  const [showPin, setShowPin]             = useState(false);
  const [loginError, setLoginError]       = useState('');

  // Signup fields
  const [signupName, setSignupName]       = useState('');
  const [signupRole, setSignupRole]       = useState('Staff Nurse / ANM');
  const [signupFacility, setSignupFacility] = useState('Primary Health Centre #1');
  const [signupPin, setSignupPin]         = useState('');
  const [signupPinConfirm, setSignupPinConfirm] = useState('');
  const [showSignupPin, setShowSignupPin] = useState(false);
  const [signupError, setSignupError]     = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  const [showLangPicker, setShowLangPicker] = useState(false);

  const ROLES = [
    'Staff Nurse / ANM',
    'Community Health Officer',
    'Medical Officer',
    'Lab Technician',
    'Pharmacist',
    'ASHA Worker',
    'Other',
  ];

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const trimmedUsername = loginUsername.trim().toLowerCase();
    if (!trimmedUsername || !loginPin) { setLoginError('Please enter your name and PIN.'); return; }
    if (!/^\d{4}$/.test(loginPin)) { setLoginError('PIN must be exactly 4 digits.'); return; }

    // Match by name (case-insensitive) or staff ID
    const match = staffList.find(s =>
      s.name.toLowerCase().includes(trimmedUsername) ||
      s.id.toLowerCase() === trimmedUsername ||
      trimmedUsername.includes(s.name.split(' ')[1]?.toLowerCase() || '__')
    );

    if (!match) { setLoginError('Staff member not found. Check your name or sign up first.'); return; }
    if (match.pin !== loginPin) { setLoginError('Incorrect PIN. Please try again.'); return; }

    onLogin(match);
  };

  // ── Signup ───────────────────────────────────────────────────────────────
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(''); setSignupSuccess('');

    if (!signupName.trim()) { setSignupError('Full name is required.'); return; }
    if (!signupFacility.trim()) { setSignupError('Facility name is required.'); return; }
    if (!/^\d{4}$/.test(signupPin)) { setSignupError('PIN must be exactly 4 digits.'); return; }
    if (signupPin !== signupPinConfirm) { setSignupError('PINs do not match.'); return; }

    const existing = staffList.find(s => s.name.toLowerCase() === signupName.trim().toLowerCase());
    if (existing) { setSignupError('A staff member with this name already exists.'); return; }

    const newStaff: Staff = {
      id: `NURSE-${Date.now()}`,
      name: signupName.trim(),
      role: signupRole,
      facilityId: 'PHC-01',
      facilityName: signupFacility.trim(),
      pin: signupPin,
    };

    const updated = [...staffList, newStaff];
    saveStaffRegistry(updated);
    setSignupSuccess(`Account created for ${newStaff.name}. You can now log in.`);
    setSignupName(''); setSignupPin(''); setSignupPinConfirm('');
    setTimeout(() => { setMode('login'); setLoginUsername(newStaff.name); setSignupSuccess(''); }, 1800);
  };

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--neo-bg)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #0d5c63 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">

        {/* Brand */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #0c5560, #0d5c63)',
              boxShadow: '8px 8px 20px rgba(13,92,99,0.4), -4px -4px 10px rgba(255,255,255,0.6)',
            }}
          >
            <Zap className="w-5 h-5 text-amber-300" />
            <span className="text-2xl font-black tracking-tight" style={{ color: '#5eead4' }}>Med</span>
            <span className="text-2xl font-black tracking-tight" style={{ color: '#fbbf24' }}>scribe</span>
          </div>
          <p className="text-sm text-slate-500">{t('app.tagline')}</p>
        </div>

        {/* Card */}
        <div className="neo-card-lg p-6 sm:p-8 space-y-6">

          {/* Mode tabs */}
          <div className="flex rounded-xl overflow-hidden" style={{ boxShadow: 'var(--neo-shadow-inset)', background: 'var(--neo-bg)' }}>
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setLoginError(''); setSignupError(''); }}
                className="flex-1 py-2.5 text-xs font-bold transition-all"
                style={
                  mode === m
                    ? { background: 'linear-gradient(135deg, #0f6b73, #0d5c63)', color: 'white',
                        boxShadow: '3px 3px 8px rgba(13,92,99,0.35)' }
                    : { color: 'var(--text-muted)' }
                }
              >
                {m === 'login' ? '🔐 Sign In' : '📋 New Staff'}
              </button>
            ))}
          </div>

          {/* Language picker */}
          <div>
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="neo-btn w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold"
              style={{ color: 'var(--teal)' }}
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('login.iSpeak')}: <strong>{SUPPORTED_LANGUAGES.find(l => l.code === locale)?.nativeLabel}</strong>
              </span>
              <span className="text-slate-400">{showLangPicker ? '▲' : '▼'}</span>
            </button>
            {showLangPicker && (
              <div className="mt-2 p-2 rounded-xl max-h-36 overflow-y-auto grid grid-cols-3 gap-1.5"
                style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-inset)' }}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLocale(lang.code); setShowLangPicker(false); }}
                    lang={lang.code}
                    className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-left transition-all"
                    style={
                      locale === lang.code
                        ? { background: 'linear-gradient(135deg, #0f6b73, #0d5c63)', color: 'white',
                            boxShadow: '2px 2px 6px rgba(13,92,99,0.3)' }
                        : { background: 'var(--neo-bg)', color: 'var(--text-secondary)',
                            boxShadow: 'var(--neo-shadow-sm)' }
                    }
                  >
                    {lang.nativeLabel}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                  Staff Name / Username
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => { setLoginUsername(e.target.value); setLoginError(''); }}
                  placeholder="e.g. Asha Devi"
                  autoComplete="username"
                  className="neo-input w-full px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                  {t('login.pinLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    value={loginPin}
                    onChange={(e) => { setLoginPin(e.target.value.replace(/\D/g, '')); setLoginError(''); }}
                    placeholder="• • • •"
                    autoComplete="current-password"
                    className="neo-input w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono font-bold text-slate-800 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium text-rose-700"
                  style={{ background: 'rgba(220,38,38,0.08)', boxShadow: 'var(--neo-shadow-sm)' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="neo-btn-primary w-full py-3.5 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {t('login.openButton')}
              </button>

              {/* Quick login chips for demo */}
              <div>
                <div className="text-[10px] text-slate-400 text-center mb-2">Quick sign-in (demo)</div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {loadStaffRegistry().map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setLoginUsername(s.name); setLoginPin(s.pin); }}
                      className="neo-btn px-3 py-1.5 text-[11px] font-medium text-slate-600"
                    >
                      {s.name.split(' ').slice(0, 2).join(' ')} · {s.pin}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* ── SIGNUP FORM ── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => { setSignupName(e.target.value); setSignupError(''); }}
                  placeholder="e.g. Nurse Kavitha Reddy"
                  className="neo-input w-full px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                  Role / Designation
                </label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  className="neo-input w-full px-4 py-3 text-sm text-slate-800"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                  Facility / Centre Name
                </label>
                <input
                  type="text"
                  value={signupFacility}
                  onChange={(e) => setSignupFacility(e.target.value)}
                  placeholder="e.g. Primary Health Centre #2"
                  className="neo-input w-full px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                    Set 4-digit PIN *
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupPin ? 'text' : 'password'}
                      maxLength={4}
                      value={signupPin}
                      onChange={(e) => { setSignupPin(e.target.value.replace(/\D/g, '')); setSignupError(''); }}
                      placeholder="• • • •"
                      className="neo-input w-full px-3 py-3 text-center text-xl tracking-[0.4em] font-mono font-bold text-slate-800 pr-9"
                    />
                    <button type="button" onClick={() => setShowSignupPin(!showSignupPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                      {showSignupPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                    Confirm PIN *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={signupPinConfirm}
                    onChange={(e) => { setSignupPinConfirm(e.target.value.replace(/\D/g, '')); setSignupError(''); }}
                    placeholder="• • • •"
                    className="neo-input w-full px-3 py-3 text-center text-xl tracking-[0.4em] font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {signupError && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium text-rose-700"
                  style={{ background: 'rgba(220,38,38,0.08)', boxShadow: 'var(--neo-shadow-sm)' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" /> {signupError}
                </div>
              )}
              {signupSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium text-emerald-700"
                  style={{ background: 'rgba(5,150,105,0.08)', boxShadow: 'var(--neo-shadow-sm)' }}>
                  ✓ {signupSuccess}
                </div>
              )}

              <button
                type="submit"
                className="neo-btn-primary w-full py-3.5 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create Staff Account
              </button>
            </form>
          )}
        </div>

        {/* Scope note */}
        <div
          className="p-4 rounded-2xl flex items-start gap-2.5"
          style={{
            background: 'linear-gradient(135deg, #0c3d42, #0a3038)',
            boxShadow: '6px 6px 16px rgba(13,92,99,0.35), -3px -3px 8px rgba(255,255,255,0.1)',
          }}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-teal-200/80 leading-relaxed">{t('login.scopeNote')}</p>
        </div>

      </div>
    </div>
  );
};
