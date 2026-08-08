import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ClinicalNote, Staff } from '../types';
import { startVoiceCapture, stopVoiceCapture } from '../lib/voiceCapture';
import { speakText, stopSpeech } from '../lib/speechSynthesis';
import { EditableField, EditableTextarea } from './EditableField';
import {
  Mic, Square, Sparkles, Volume2, CheckCircle, AlertTriangle,
  ArrowRight, ShieldAlert, HelpCircle, Clock, BookOpen, Info, Loader2
} from 'lucide-react';

interface CaptureViewProps {
  currentStaff: Staff;
  onNoteSigned: (note: ClinicalNote) => void;
  recentSignedNotes: ClinicalNote[];
  onNavigateToRegister: () => void;
}

export const CaptureView: React.FC<CaptureViewProps> = ({
  currentStaff, onNoteSigned, recentSignedNotes, onNavigateToRegister,
}) => {
  const { t, bcp47 } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<ClinicalNote | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => { return () => { stopVoiceCapture(); stopSpeech(); }; }, []);

  const handleToggleRecording = () => {
    if (isRecording) { stopVoiceCapture(); setIsRecording(false); return; }
    setErrorMessage(null); setConfidence(null);
    const rec = startVoiceCapture(bcp47, {
      onStart: () => setIsRecording(true),
      onResult: (text, conf) => {
        setIsRecording(false);
        if (text) { setTranscript((prev) => prev ? `${prev} ${text}` : text); setConfidence(conf); }
      },
      onError: (errCode) => {
        setIsRecording(false);
        if (errCode === 'NOT_ALLOWED') setErrorMessage(t('error.NOT_ALLOWED'));
        else if (errCode === 'BROWSER_UNSUPPORTED') setErrorMessage(t('error.BROWSER_UNSUPPORTED'));
        else if (errCode !== 'no-speech' && errCode !== 'aborted') setErrorMessage(t('error.NO_SPEECH'));
      },
      onEnd: () => setIsRecording(false),
    });
    if (!rec) setIsRecording(false);
  };

  const handlePrepareDraft = async () => {
    if (!transcript.trim()) return;
    setLoadingDraft(true); setErrorMessage(null); setActiveDraft(null);
    try {
      const response = await fetch('/api/notes/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript.trim(), preferred_language_hint: bcp47,
          nurse_id: currentStaff.id, facility_id: currentStaff.facilityId }),
      });
      if (!response.ok) throw new Error('draft_api_failed');
      const data = await response.json();
      setActiveDraft(data);
      const spokenText = data.spoken_confirmation?.text_in_detected_language || data.spoken_confirmation?.text;
      const langCode = data.spoken_confirmation?.language_code || bcp47;
      if (spokenText) speakText(spokenText, langCode);
    } catch (err) { setErrorMessage(t('error.apiFailure')); }
    finally { setLoadingDraft(false); }
  };

  const handleSaveFieldEdit = async (fieldPath: string, newValue: string) => {
    if (!activeDraft) return;
    try {
      const res = await fetch(`/api/notes/${activeDraft.note_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurse_id: currentStaff.id, field: fieldPath, new_value: newValue, reason: 'nurse_correction' }),
      });
      if (res.ok) {
        setActiveDraft((prev) => {
          if (!prev) return null;
          const updated = { ...prev };
          const parts = fieldPath.split('.');
          let curr: any = updated;
          for (let i = 0; i < parts.length - 1; i++) curr = curr[parts[i]];
          curr[parts[parts.length - 1]] = newValue;
          return updated;
        });
      }
    } catch (e) { console.error('Field edit save failed:', e); }
  };

  const handleSignNote = async () => {
    if (!activeDraft) return;
    setIsSigning(true);
    try {
      const res = await fetch(`/api/notes/${activeDraft.note_id}/sign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurse_id: currentStaff.id }),
      });
      if (res.ok) {
        const signedNote: ClinicalNote = { ...activeDraft, status: 'SIGNED', signed_at: new Date().toISOString() };
        onNoteSigned(signedNote);
        setToastMessage(t('toast.signed'));
        setActiveDraft(null); setTranscript('');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) { setErrorMessage('Failed to sign note'); }
    finally { setIsSigning(false); }
  };

  const urgencyColor = (level: string) => {
    if (level === 'CRITICAL') return '#dc2626';
    if (level === 'URGENT') return '#d97706';
    return '#059669';
  };


  return (
    <div className="space-y-6">

      {/* Toast */}
      {toastMessage && (
        <div
          className="fixed top-20 right-4 sm:right-6 z-50 px-4 py-3 rounded-xl flex items-center gap-2 animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #0f6b73, #0d5c63)',
            boxShadow: '8px 8px 20px rgba(13,92,99,0.5), -4px -4px 12px rgba(255,255,255,0.3)',
            color: 'white',
          }}
        >
          <CheckCircle className="w-4 h-4 text-teal-300" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--teal)' }}>
            {t('capture.breadcrumb')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-display text-slate-800">{t('capture.heading')}</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">{t('capture.subheading')}</p>
        </div>
        <button
          onClick={onNavigateToRegister}
          className="neo-btn self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
          style={{ color: 'var(--teal)' }}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('capture.seeRegister')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Capture + Draft ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Voice + Transcript card */}
          <div className="neo-card p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {t('capture.storyLabel')}
              </span>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(13,92,99,0.08)',
                  color: 'var(--teal)',
                  boxShadow: 'var(--neo-shadow-sm)',
                }}
              >
                {t('capture.editable')}
              </span>
            </div>

            {/* Mic button area */}
            <div
              className="flex flex-col items-center justify-center py-6 rounded-2xl"
              style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-inset)' }}
            >
              <button
                type="button"
                onClick={handleToggleRecording}
                disabled={loadingDraft}
                className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300"
                style={
                  isRecording
                    ? {
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        boxShadow: '0 0 0 12px rgba(239,68,68,0.12), 6px 6px 16px rgba(220,38,38,0.5), -3px -3px 8px rgba(255,255,255,0.4)',
                        transform: 'scale(1.05)',
                      }
                    : {
                        background: 'linear-gradient(135deg, #0f6b73, #0d5c63)',
                        boxShadow: '8px 8px 18px rgba(13,92,99,0.45), -5px -5px 12px rgba(255,255,255,0.7)',
                      }
                }
                aria-label={isRecording ? t('capture.stopRecord') : t('capture.tapToRecord')}
              >
                {isRecording ? (
                  <>
                    <Square className="w-7 h-7 fill-current text-white" />
                    <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-60" />
                  </>
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {isRecording ? t('capture.stopRecord') : t('capture.tapToRecord')}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isRecording ? t('capture.recordingState') : t('capture.orType')}
                </p>
              </div>
            </div>

            {/* Transcript textarea */}
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={t('capture.placeholder')}
              rows={4}
              className="neo-input w-full px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed resize-none"
            />

            {/* Alerts */}
            {confidence !== null && confidence < 0.6 && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium"
                style={{
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  color: '#92400e',
                  boxShadow: 'var(--neo-shadow-sm)',
                }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                {t('capture.lowConfidence')}
              </div>
            )}
            {errorMessage && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium"
                style={{
                  background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                  color: '#991b1b',
                  boxShadow: 'var(--neo-shadow-sm)',
                }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                {errorMessage}
              </div>
            )}

            {/* Prepare draft button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handlePrepareDraft}
                disabled={loadingDraft || !transcript.trim()}
                className="neo-btn-amber w-full sm:w-auto px-6 py-3 text-sm font-black disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                style={{ color: '#451a03' }}
              >
                {loadingDraft ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Preparing draft...</span></>
                ) : (
                  <><Sparkles className="w-4 h-4" /><span>{t('capture.prepareButton')}</span></>
                )}
              </button>
            </div>
          </div>


          {/* Draft review panel */}
          {activeDraft && (
            <div className="neo-card-lg p-5 sm:p-6 space-y-5 animate-fade-slide">

              {/* Draft header */}
              <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
                <div>
                  <h2 className="text-lg font-display text-slate-800">{t('draft.heading')}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t('draft.subheading')}</p>
                </div>
                {activeDraft.spoken_confirmation?.text_in_detected_language && (
                  <button
                    onClick={() => speakText(activeDraft.spoken_confirmation.text_in_detected_language, activeDraft.spoken_confirmation.language_code)}
                    className="neo-btn flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
                    style={{ color: 'var(--teal)' }}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{t('draft.playAudio')}</span>
                  </button>
                )}
              </div>

              {/* Priority & next-step row */}
              <div
                className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl"
                style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-inset)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="px-3.5 py-1.5 rounded-lg font-black text-sm tracking-wider uppercase text-white"
                    style={{
                      background: urgencyColor(activeDraft.queue_priority.urgency_level),
                      boxShadow: `0 3px 10px ${urgencyColor(activeDraft.queue_priority.urgency_level)}55`,
                    }}
                  >
                    {t(`priority.${activeDraft.queue_priority.urgency_level}`)}
                  </span>
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Risk Score</div>
                    <div className="text-sm font-black text-slate-800 font-mono">
                      {activeDraft.queue_priority.risk_score_1_to_10} / 10
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('draft.nextStep')}</div>
                  <div className="text-xs font-bold" style={{ color: 'var(--teal)' }}>
                    {t(`nextStep.${activeDraft.queue_priority.next_step}`)}
                  </div>
                </div>
              </div>

              {/* Priority rationale */}
              {activeDraft.queue_priority.priority_rationale && (
                <div
                  className="p-3.5 rounded-xl text-xs text-slate-700 leading-relaxed"
                  style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-inset)' }}
                >
                  <span className="font-bold text-slate-800">{t('draft.priorityRationale')}: </span>
                  {activeDraft.queue_priority.priority_rationale}
                </div>
              )}

              {/* Patient fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditableField label="Patient Name" value={activeDraft.clinical_note.patient_name || 'Patient'}
                  onSave={(v) => handleSaveFieldEdit('clinical_note.patient_name', v)} />
                <EditableField label={t('draft.duration')} value={activeDraft.clinical_note.symptom_duration || '1 day'}
                  onSave={(v) => handleSaveFieldEdit('clinical_note.symptom_duration', v)} />
              </div>
              <EditableField label={t('draft.chiefComplaint')} value={activeDraft.clinical_note.chief_complaint}
                onSave={(v) => handleSaveFieldEdit('clinical_note.chief_complaint', v)} />

              {/* Vitals grid */}
              <div>
                <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">{t('draft.vitals')}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'TEMP', value: activeDraft.clinical_note.extracted_vitals?.temperature_f ? `${activeDraft.clinical_note.extracted_vitals.temperature_f} °F` : '—' },
                    { label: 'BP', value: activeDraft.clinical_note.extracted_vitals?.bp_sys ? `${activeDraft.clinical_note.extracted_vitals.bp_sys}/${activeDraft.clinical_note.extracted_vitals.bp_dia}` : '—' },
                    { label: 'PULSE', value: activeDraft.clinical_note.extracted_vitals?.pulse_bpm ? `${activeDraft.clinical_note.extracted_vitals.pulse_bpm} bpm` : '—' },
                    { label: 'SpO2', value: activeDraft.clinical_note.extracted_vitals?.spo2_percent ? `${activeDraft.clinical_note.extracted_vitals.spo2_percent}%` : '—' },
                  ].map((v) => (
                    <div key={v.label} className="p-3 rounded-xl" style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-inset)' }}>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{v.label}</div>
                      <div className="text-sm font-black text-slate-800 font-mono mt-0.5">{v.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Term normalisation */}
              {activeDraft.meta?.term_normalisation?.length > 0 && (
                <div className="p-3.5 rounded-xl space-y-2" style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-inset)' }}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Term Normalisation</div>
                  {activeDraft.meta.term_normalisation.map((tm, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">"{tm.heard}"</span>
                      <ArrowRight className="w-3 h-3" style={{ color: 'var(--teal)' }} />
                      <span className="font-semibold text-slate-800">{tm.documented_as}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Escalation flags */}
              {activeDraft.escalation?.flags?.length > 0 && (
                <div className="p-3.5 rounded-xl space-y-2" style={{
                  background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                  boxShadow: 'var(--neo-shadow-sm)',
                }}>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5" />{t('draft.escalation')}
                  </div>
                  {activeDraft.escalation.flags.map((f, idx) => (
                    <div key={idx} className="text-xs text-rose-900 font-semibold p-2 rounded-lg bg-white/60">{f.observation}</div>
                  ))}
                </div>
              )}

              {/* Missing fields chips */}
              {activeDraft.missing_fields?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />{t('draft.missingFields')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeDraft.missing_fields.map((mf, idx) => (
                      <button key={idx}
                        onClick={() => setTranscript((p) => p ? `${p} ${mf.question_english}` : mf.question_english)}
                        className="neo-btn text-xs px-3 py-1.5 font-medium text-slate-700 flex items-center gap-1"
                      >
                        <span>+ {mf.question_english}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <EditableTextarea label={t('draft.narrativeNote')} value={activeDraft.clinical_note.narrative_note}
                onSave={(v) => handleSaveFieldEdit('clinical_note.narrative_note', v)} />

              {/* Sign button */}
              <button
                type="button" onClick={handleSignNote} disabled={isSigning}
                className="neo-btn-primary w-full py-4 text-white font-black text-base flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSigning ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span>Signing note...</span></>
                ) : (
                  <><CheckCircle className="w-5 h-5 text-teal-300" /><span>{t('draft.signButton')}</span></>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Recent signed + Safety ── */}
        <div className="space-y-5">

          {/* Recent signed notes */}
          <div className="neo-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t('capture.recentlySigned')}</span>
              <button onClick={onNavigateToRegister} className="text-xs font-semibold" style={{ color: 'var(--teal)' }}>
                {t('capture.seeRegister')}
              </button>
            </div>

            {recentSignedNotes.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">{t('register.empty')}</div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-0.5">
                {recentSignedNotes.slice(0, 5).map((note) => (
                  <button
                    key={note.note_id} onClick={onNavigateToRegister}
                    className="w-full text-left p-3 rounded-xl transition-all"
                    style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-sm)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate mr-2">
                        {note.clinical_note?.patient_name || 'Patient'}
                      </span>
                      <span
                        className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md text-white shrink-0"
                        style={{ background: urgencyColor(note.urgency), fontSize: '9px' }}
                      >
                        {note.urgency}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{note.clinical_note?.chief_complaint}</p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {note.signed_at ? new Date(note.signed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      <span className="font-semibold" style={{ color: 'var(--teal)' }}>SIGNED</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Safety note */}
          <div
            className="p-4 rounded-xl space-y-2"
            style={{
              background: 'linear-gradient(160deg, #0c3d42, #0a3038)',
              boxShadow: '6px 6px 16px rgba(13,92,99,0.4), -3px -3px 8px rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Info className="w-4 h-4" /><span>A note about safety</span>
            </div>
            <p className="text-xs text-teal-200/80 leading-relaxed">{t('capture.safetyNote')}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
