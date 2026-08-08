import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ClinicalNote, Staff } from '../types';
import { startVoiceCapture, stopVoiceCapture } from '../lib/voiceCapture';
import { speakText, stopSpeech } from '../lib/speechSynthesis';
import { EditableField, EditableTextarea } from './EditableField';
import {
  Mic,
  Square,
  Sparkles,
  Volume2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Clock,
  BookOpen,
  Info,
  Loader2
} from 'lucide-react';

interface CaptureViewProps {
  currentStaff: Staff;
  onNoteSigned: (note: ClinicalNote) => void;
  recentSignedNotes: ClinicalNote[];
  onNavigateToRegister: () => void;
}

export const CaptureView: React.FC<CaptureViewProps> = ({
  currentStaff,
  onNoteSigned,
  recentSignedNotes,
  onNavigateToRegister,
}) => {
  const { t, bcp47, locale } = useLanguage();

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Draft State
  const [activeDraft, setActiveDraft] = useState<ClinicalNote | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Clean up voice capture & TTS on unmount
  useEffect(() => {
    return () => {
      stopVoiceCapture();
      stopSpeech();
    };
  }, []);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopVoiceCapture();
      setIsRecording(false);
      return;
    }

    setErrorMessage(null);
    setConfidence(null);

    const rec = startVoiceCapture(bcp47, {
      onStart: () => setIsRecording(true),
      onResult: (text, conf) => {
        setIsRecording(false);
        if (text) {
          // Set text cleanly
          setTranscript((prev) => (prev ? `${prev} ${text}` : text));
          setConfidence(conf);
        }
      },
      onError: (errCode) => {
        setIsRecording(false);
        if (errCode === 'NOT_ALLOWED') {
          setErrorMessage(t('error.NOT_ALLOWED'));
        } else if (errCode === 'BROWSER_UNSUPPORTED') {
          setErrorMessage(t('error.BROWSER_UNSUPPORTED'));
        } else if (errCode !== 'no-speech' && errCode !== 'aborted') {
          setErrorMessage(t('error.NO_SPEECH'));
        }
      },
      onEnd: () => setIsRecording(false),
    });

    if (!rec) {
      setIsRecording(false);
    }
  };

  const handlePrepareDraft = async () => {
    if (!transcript.trim()) return;

    setLoadingDraft(true);
    setErrorMessage(null);
    setActiveDraft(null);

    try {
      const response = await fetch('/api/notes/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          preferred_language_hint: bcp47,
          nurse_id: currentStaff.id,
          facility_id: currentStaff.facilityId,
        }),
      });

      if (!response.ok) {
        throw new Error('draft_api_failed');
      }

      const data = await response.json();
      setActiveDraft(data);

      // Playback spoken confirmation if available
      const spokenText = data.spoken_confirmation?.text_in_detected_language || data.spoken_confirmation?.text;
      const langCode = data.spoken_confirmation?.language_code || bcp47;
      if (spokenText) {
        speakText(spokenText, langCode);
      }
    } catch (err) {
      setErrorMessage(t('error.apiFailure'));
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleSaveFieldEdit = async (fieldPath: string, newValue: string) => {
    if (!activeDraft) return;

    try {
      const res = await fetch(`/api/notes/${activeDraft.note_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nurse_id: currentStaff.id,
          field: fieldPath,
          new_value: newValue,
          reason: 'nurse_correction',
        }),
      });

      if (res.ok) {
        // Update local state copy
        setActiveDraft((prev) => {
          if (!prev) return null;
          const updated = { ...prev };
          const parts = fieldPath.split('.');
          let curr: any = updated;
          for (let i = 0; i < parts.length - 1; i++) {
            curr = curr[parts[i]];
          }
          curr[parts[parts.length - 1]] = newValue;
          return updated;
        });
      }
    } catch (e) {
      console.error('Field edit save failed:', e);
    }
  };

  const handleSignNote = async () => {
    if (!activeDraft) return;

    setIsSigning(true);
    try {
      const res = await fetch(`/api/notes/${activeDraft.note_id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurse_id: currentStaff.id }),
      });

      if (res.ok) {
        const signedNote: ClinicalNote = {
          ...activeDraft,
          status: 'SIGNED',
          signed_at: new Date().toISOString(),
        };

        onNoteSigned(signedNote);
        setToastMessage(t('toast.signed'));
        setActiveDraft(null);
        setTranscript('');

        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      setErrorMessage('Failed to sign note');
    } finally {
      setIsSigning(false);
    }
  };

  const handleAppendMissingFieldQuestion = (q: string) => {
    setTranscript((prev) => (prev ? `${prev} ${q}` : q));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-teal-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-teal-600 animate-bounce">
          <CheckCircle className="w-5 h-5 text-teal-300" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/40 pb-4">
        <div>
          <div className="text-[11px] font-bold tracking-widest text-teal-700 dark:text-teal-400 uppercase">
            {t('capture.breadcrumb')}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            {t('capture.heading')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {t('capture.subheading')}
          </p>
        </div>

        <button
          onClick={onNavigateToRegister}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
        >
          <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>{t('capture.seeRegister')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Voice Capture & Draft Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Voice & Transcript Input Box */}
          <div className="bg-amber-50/50 dark:bg-slate-800/80 border border-emerald-900/20 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                {t('capture.storyLabel')}
              </span>
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                {t('capture.editable')}
              </span>
            </div>

            {/* Microphone Push-To-Talk Button */}
            <div className="flex flex-col items-center justify-center p-4 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200/80 dark:border-slate-700/80">
              
              <button
                type="button"
                onClick={handleToggleRecording}
                disabled={loadingDraft}
                className={`relative group w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 text-white ring-8 ring-rose-500/30 scale-105'
                    : 'bg-[#0d5c63] hover:bg-[#09484e] text-white ring-4 ring-teal-600/20 hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-7 h-7 fill-current" />
                    <span className="absolute -inset-1 rounded-full border-2 border-rose-400 animate-ping opacity-75"></span>
                  </>
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>

              <div className="mt-3 text-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isRecording ? t('capture.stopRecord') : t('capture.tapToRecord')}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isRecording ? t('capture.recordingState') : t('capture.orType')}
                </p>
              </div>

            </div>

            {/* Editable Transcript Textarea */}
            <div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={t('capture.placeholder')}
                rows={4}
                className="w-full bg-white dark:bg-slate-900 border border-amber-300/80 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5c63] shadow-inner"
              />
            </div>

            {/* Low Confidence Alert */}
            {confidence !== null && confidence < 0.6 && (
              <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 p-2.5 rounded-lg border border-amber-300 dark:border-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{t('capture.lowConfidence')}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Prepare Draft Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handlePrepareDraft}
                disabled={loadingDraft || !transcript.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-[#451a03] text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loadingDraft ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#451a03]" />
                    <span>Preparing draft...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#451a03]" />
                    <span>{t('capture.prepareButton')}</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Draft Review Panel */}
          {activeDraft && (
            <div className="bg-white dark:bg-slate-800 border-2 border-[#0d5c63]/30 rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn relative overflow-hidden">
              <div className="absolute top-0 left-10 h-full w-[1px] bg-red-200/80 pointer-events-none hidden sm:block"></div>
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <h2 className="text-xl font-black text-[#0d5c63] dark:text-teal-400">
                    {t('draft.heading')}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t('draft.subheading')}
                  </p>
                </div>

                {/* Spoken Confirmation Audio Playback */}
                {activeDraft.spoken_confirmation?.text_in_detected_language && (
                  <button
                    onClick={() =>
                      speakText(
                        activeDraft.spoken_confirmation.text_in_detected_language,
                        activeDraft.spoken_confirmation.language_code
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/60 text-[#0d5c63] dark:text-teal-200 text-xs font-bold border border-teal-200 hover:bg-teal-100 transition-colors"
                  >
                    <Volume2 className="w-4 h-4 text-[#0d5c63]" />
                    <span>{t('draft.playAudio')}</span>
                  </button>
                )}
              </div>

              {/* Priority Stamp Badge & Next Step */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3.5 py-1.5 rounded-md font-black text-sm tracking-wider uppercase shadow-sm ${
                      activeDraft.queue_priority.urgency_level === 'CRITICAL'
                        ? 'bg-rose-700 text-white border-2 border-rose-900 animate-pulse'
                        : activeDraft.queue_priority.urgency_level === 'URGENT'
                        ? 'bg-amber-600 text-white border-2 border-amber-800'
                        : 'bg-emerald-700 text-white border-2 border-emerald-900'
                    }`}
                  >
                    {t(`priority.${activeDraft.queue_priority.urgency_level}`)}
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Risk Score</div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      {activeDraft.queue_priority.risk_score_1_to_10} / 10
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t('draft.nextStep')}</div>
                  <div className="text-xs font-extrabold text-teal-800 dark:text-teal-300">
                    {t(`nextStep.${activeDraft.queue_priority.next_step}`)}
                  </div>
                </div>
              </div>

              {/* Priority Rationale */}
              {activeDraft.queue_priority.priority_rationale && (
                <div className="p-3 bg-amber-50 dark:bg-slate-900/60 border border-amber-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{t('draft.priorityRationale')}: </span>
                  {activeDraft.queue_priority.priority_rationale}
                </div>
              )}

              {/* Patient Name & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditableField
                  label="Patient Name"
                  value={activeDraft.clinical_note.patient_name || 'Patient'}
                  onSave={(val) => handleSaveFieldEdit('clinical_note.patient_name', val)}
                />
                <EditableField
                  label={t('draft.duration')}
                  value={activeDraft.clinical_note.symptom_duration || '1 day'}
                  onSave={(val) => handleSaveFieldEdit('clinical_note.symptom_duration', val)}
                />
              </div>

              {/* Chief Complaint */}
              <EditableField
                label={t('draft.chiefComplaint')}
                value={activeDraft.clinical_note.chief_complaint}
                onSave={(val) => handleSaveFieldEdit('clinical_note.chief_complaint', val)}
              />

              {/* Extracted Vitals Summary */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  {t('draft.vitals')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">TEMP</div>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">
                      {activeDraft.clinical_note.extracted_vitals?.temperature_f
                        ? `${activeDraft.clinical_note.extracted_vitals.temperature_f} °F`
                        : '—'}
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">BP</div>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">
                      {activeDraft.clinical_note.extracted_vitals?.bp_sys
                        ? `${activeDraft.clinical_note.extracted_vitals.bp_sys}/${activeDraft.clinical_note.extracted_vitals.bp_dia} mmHg`
                        : '—'}
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">PULSE</div>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">
                      {activeDraft.clinical_note.extracted_vitals?.pulse_bpm
                        ? `${activeDraft.clinical_note.extracted_vitals.pulse_bpm} bpm`
                        : '—'}
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">SpO2</div>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">
                      {activeDraft.clinical_note.extracted_vitals?.spo2_percent
                        ? `${activeDraft.clinical_note.extracted_vitals.spo2_percent}%`
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Term Normalisation (Heard as -> Documented as) */}
              {activeDraft.meta?.term_normalisation && activeDraft.meta.term_normalisation.length > 0 && (
                <div className="p-3 bg-emerald-50/80 dark:bg-slate-900/80 rounded-xl border border-emerald-200 dark:border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                    Term Normalisation (Audited)
                  </div>
                  <div className="space-y-1">
                    {activeDraft.meta.term_normalisation.map((tm, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-medium">"{tm.heard}"</span>
                        <ArrowRight className="w-3 h-3 text-emerald-600" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{tm.documented_as}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Escalation Flags */}
              {activeDraft.escalation?.flags && activeDraft.escalation.flags.length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 space-y-2">
                  <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>{t('draft.escalation')}</span>
                  </div>
                  {activeDraft.escalation.flags.map((f, idx) => (
                    <div key={idx} className="text-xs text-rose-900 dark:text-rose-200 font-semibold bg-white dark:bg-slate-900 p-2 rounded border border-rose-200">
                      {f.observation}
                    </div>
                  ))}
                </div>
              )}

              {/* Missing Fields Tappable Chips */}
              {activeDraft.missing_fields && activeDraft.missing_fields.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t('draft.missingFields')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeDraft.missing_fields.map((mf, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAppendMissingFieldQuestion(mf.question_english)}
                        className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium px-3 py-1.5 rounded-lg border border-amber-300 transition-colors flex items-center gap-1"
                      >
                        <span>+ {mf.question_english}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Narrative Register Note (Editable) */}
              <EditableTextarea
                label={t('draft.narrativeNote')}
                value={activeDraft.clinical_note.narrative_note}
                onSave={(val) => handleSaveFieldEdit('clinical_note.narrative_note', val)}
              />

              {/* Sign Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSignNote}
                  disabled={isSigning}
                  className="w-full py-4 rounded-xl bg-[#0d5c63] hover:bg-[#09484e] text-white text-base font-black tracking-wide shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 border-2 border-teal-500/30"
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing note to register...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6 text-[#2dd4bf]" />
                      <span>{t('draft.signButton')}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Right Column (1 Col): Recently Signed Lines & Safety Note */}
        <div className="space-y-6">
          
          {/* Recently Signed Cards */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('capture.recentlySigned')}
              </span>
              <button
                onClick={onNavigateToRegister}
                className="text-xs text-teal-700 dark:text-teal-400 font-semibold hover:underline"
              >
                {t('capture.seeRegister')}
              </button>
            </div>

            {recentSignedNotes.length === 0 ? (
              <div className="text-xs text-slate-400 p-4 text-center">
                {t('register.empty')}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {recentSignedNotes.slice(0, 5).map((note) => (
                  <div
                    key={note.note_id}
                    className="p-3 rounded-xl bg-amber-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1 hover:border-teal-400 transition-colors cursor-pointer"
                    onClick={onNavigateToRegister}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-800 dark:text-slate-200">
                        {note.clinical_note?.patient_name || 'Patient'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                          note.urgency === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : note.urgency === 'URGENT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {note.urgency}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                      {note.clinical_note?.chief_complaint}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {note.signed_at ? new Date(note.signed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      <span className="text-teal-700 dark:text-teal-400 font-semibold">SIGNED</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scope Wall Safety Card */}
          <div className="bg-emerald-950 text-slate-100 p-4 rounded-2xl border border-emerald-800 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Info className="w-4 h-4" />
              <span>A note about safety</span>
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              {t('capture.safetyNote')}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
