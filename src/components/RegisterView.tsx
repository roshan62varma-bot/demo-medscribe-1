import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ClinicalNote, Staff } from '../types';
import {
  Download, Printer, Search, BookOpen, Clock,
  ChevronRight, X, MessageSquareText, Edit2, Trash2,
  Save, AlertTriangle, Check,
} from 'lucide-react';

interface RegisterViewProps {
  signedNotes: ClinicalNote[];
  onOpenChatbot: () => void;
  onNoteDeleted: (noteId: string) => void;
  onNoteUpdated: (note: ClinicalNote) => void;
  currentStaff: Staff;
}

interface EditDraft {
  patient_name: string;
  chief_complaint: string;
  narrative_note: string;
  urgency: 'CRITICAL' | 'URGENT' | 'ROUTINE';
  next_step: string;
}

const NEXT_STEPS = [
  'REFER_TO_MO_NOW',
  'FLAG_FOR_MO_THIS_SESSION',
  'RECORD_IN_REGISTER',
  'SCHEDULE_FOLLOW_UP',
  'NEEDS_MORE_INFORMATION',
];

export const RegisterView: React.FC<RegisterViewProps> = ({
  signedNotes, onOpenChatbot, onNoteDeleted, onNoteUpdated, currentStaff,
}) => {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'ALL'|'CRITICAL'|'URGENT'|'ROUTINE'>('ALL');
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [editingNote, setEditingNote]   = useState<ClinicalNote | null>(null);
  const [editDraft, setEditDraft]       = useState<EditDraft | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ClinicalNote | null>(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');

  const filteredNotes = signedNotes.filter((note) => {
    if (activeFilter !== 'ALL' && note.urgency !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !(note.clinical_note?.patient_name || '').toLowerCase().includes(q) &&
        !(note.clinical_note?.chief_complaint || '').toLowerCase().includes(q) &&
        !(note.raw_input || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const urgencyColor = (level: string) => {
    if (level === 'CRITICAL') return '#dc2626';
    if (level === 'URGENT')   return '#d97706';
    return '#059669';
  };

  const totalLines    = signedNotes.length;
  const criticalCount = signedNotes.filter(n => n.urgency === 'CRITICAL').length;
  const urgentCount   = signedNotes.filter(n => n.urgency === 'URGENT').length;
  const routineCount  = signedNotes.filter(n => n.urgency === 'ROUTINE').length;

  const statCards = [
    { label: t('register.totalLines'),   value: totalLines,    color: 'var(--teal)', bg: 'rgba(13,92,99,0.08)' },
    { label: t('register.criticalCount'),value: criticalCount, color: '#dc2626',     bg: 'rgba(220,38,38,0.08)' },
    { label: t('register.urgentCount'),  value: urgentCount,   color: '#d97706',     bg: 'rgba(217,119,6,0.08)' },
    { label: t('register.routineCount'), value: routineCount,  color: '#059669',     bg: 'rgba(5,150,105,0.08)' },
  ];

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!signedNotes.length) return;
    const headers = ['Line No','Date','Time','Patient Name','Age','Chief Complaint','BP','Pulse','Temp','SpO2','Priority','Next Step'];
    const rows = signedNotes.map((n, idx) => [
      idx + 1,
      n.signed_at ? new Date(n.signed_at).toLocaleDateString() : '',
      n.signed_at ? new Date(n.signed_at).toLocaleTimeString() : '',
      `"${n.clinical_note?.patient_name || 'Patient'}"`,
      n.clinical_note?.age_years || '',
      `"${(n.clinical_note?.chief_complaint || '').replace(/"/g, '""')}"`,
      n.clinical_note?.extracted_vitals?.bp_sys
        ? `${n.clinical_note.extracted_vitals.bp_sys}/${n.clinical_note.extracted_vitals.bp_dia}` : '',
      n.clinical_note?.extracted_vitals?.pulse_bpm || '',
      n.clinical_note?.extracted_vitals?.temperature_f || '',
      n.clinical_note?.extracted_vitals?.spo2_percent || '',
      n.urgency, n.next_step,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Medscribe_OPD_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = (note: ClinicalNote, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNote(note);
    setEditDraft({
      patient_name:    note.clinical_note?.patient_name || '',
      chief_complaint: note.clinical_note?.chief_complaint || '',
      narrative_note:  note.clinical_note?.narrative_note || '',
      urgency:         note.urgency,
      next_step:       note.next_step,
    });
    setSaveError('');
  };

  // ── Save edit ─────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editingNote || !editDraft) return;
    if (!editDraft.patient_name.trim()) { setSaveError('Patient name cannot be empty.'); return; }
    if (!editDraft.chief_complaint.trim()) { setSaveError('Chief complaint cannot be empty.'); return; }
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`/api/notes/${editingNote.note_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editDraft, nurse_id: currentStaff.id }),
      });
      if (!res.ok) throw new Error('save_failed');
      const updated: ClinicalNote = {
        ...editingNote,
        urgency: editDraft.urgency as any,
        next_step: editDraft.next_step as any,
        clinical_note: {
          ...editingNote.clinical_note,
          patient_name:    editDraft.patient_name,
          chief_complaint: editDraft.chief_complaint,
          narrative_note:  editDraft.narrative_note,
        },
      };
      onNoteUpdated(updated);
      setEditingNote(null); setEditDraft(null);
    } catch {
      setSaveError('Failed to save. Try again.');
    } finally { setSaving(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await fetch(`/api/notes/${deleteConfirm.note_id}`, { method: 'DELETE' });
      onNoteDeleted(deleteConfirm.note_id);
      setDeleteConfirm(null);
      if (selectedNote?.note_id === deleteConfirm.note_id) setSelectedNote(null);
    } catch {
      // silently clear — note removed client-side regardless
      onNoteDeleted(deleteConfirm.note_id);
      setDeleteConfirm(null);
    } finally { setDeleting(false); }
  };


  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--teal)' }}>
            {t('register.breadcrumb')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-display text-slate-800">{t('register.heading')}</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">{t('register.subheading')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto no-print">
          <button onClick={handleExportCSV}
            className="neo-btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white">
            <Download className="w-3.5 h-3.5 text-teal-300" />
            <span>{t('register.exportButton')}</span>
          </button>
          <button onClick={() => window.print()}
            className="neo-btn flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600">
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('register.printButton')}</span>
          </button>
          <button onClick={onOpenChatbot}
            className="neo-btn-amber flex items-center gap-1.5 px-3.5 py-2 text-xs font-black" style={{ color: '#451a03' }}>
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>{t('register.askAssistant')}</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="neo-card-sm p-4" style={{ background: card.bg }}>
            <div className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: card.color }}>
              {card.label}
            </div>
            <div className="text-2xl font-black font-mono" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="neo-card p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 no-print">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
          {(['ALL','CRITICAL','URGENT','ROUTINE'] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
              style={activeFilter === f
                ? { background: 'linear-gradient(135deg,#0f6b73,#0d5c63)', color: 'white', boxShadow: '3px 3px 8px rgba(13,92,99,0.35)' }
                : { background: 'var(--neo-bg)', color: 'var(--text-muted)', boxShadow: 'var(--neo-shadow-sm)' }
              }>
              {t(`register.filter.${f.toLowerCase()}`)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('register.search')}
            className="neo-input w-full pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400" />
        </div>
      </div>

      {/* Table */}
      <div className="neo-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#0c5560,#0d5c63)' }}>
                {['No.', t('register.col.patient'), t('register.col.vitals'),
                  t('register.col.priority'), t('register.col.time'),
                  t('register.col.nextStep'), 'Actions'].map((col, i) => (
                  <th key={i}
                    className="py-3 px-4 text-[10px] font-bold tracking-wider uppercase text-white/80"
                    style={{ textAlign: i === 0 ? 'center' : i === 6 ? 'right' : 'left' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span className="text-sm text-slate-400">{t('register.empty')}</span>
                  </td>
                </tr>
              ) : filteredNotes.map((note, idx) => {
                const v = note.clinical_note?.extracted_vitals;
                const vitalsStr = [
                  v?.temperature_f ? `${v.temperature_f}°F` : null,
                  v?.bp_sys        ? `${v.bp_sys}/${v.bp_dia}` : null,
                  v?.pulse_bpm     ? `${v.pulse_bpm}bpm` : null,
                  v?.spo2_percent  ? `SpO2 ${v.spo2_percent}%` : null,
                ].filter(Boolean).join(' · ');
                return (
                  <tr key={note.note_id}
                    onClick={() => setSelectedNote(note)}
                    className="cursor-pointer transition-all border-b"
                    style={{ borderColor: 'rgba(163,177,198,0.2)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(13,92,99,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400 text-xs">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-bold text-slate-800">
                        {note.clinical_note?.patient_name || 'Patient'}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-serif">
                        {note.clinical_note?.chief_complaint}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono font-semibold text-slate-600">
                      {vitalsStr || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase text-white"
                        style={{ background: urgencyColor(note.urgency), boxShadow: `0 2px 6px ${urgencyColor(note.urgency)}55` }}>
                        {note.urgency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {note.signed_at ? new Date(note.signed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold" style={{ color: 'var(--teal)' }}>
                      {t(`nextStep.${note.next_step}`)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit */}
                        <button
                          onClick={e => openEdit(note, e)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-sm)', color: 'var(--teal)' }}
                          title="Edit note"
                          aria-label="Edit note">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteConfirm(note); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: 'rgba(220,38,38,0.08)', boxShadow: 'var(--neo-shadow-sm)', color: '#dc2626' }}
                          title="Delete note"
                          aria-label="Delete note">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {/* View */}
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedNote(note); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-sm)', color: 'var(--text-muted)' }}
                          title="View details">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* ── View Detail Modal ──────────────────────────────────────────────── */}
      {selectedNote && !editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,30,40,0.75)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-2xl animate-scale-in overflow-y-auto"
            style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-lg)', borderRadius: '1.5rem', maxHeight: '90dvh' }}>
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-4"
                style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    NOTE #{selectedNote.note_id.slice(-6)}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase text-white"
                    style={{ background: urgencyColor(selectedNote.urgency), boxShadow: `0 2px 8px ${urgencyColor(selectedNote.urgency)}55` }}>
                    {selectedNote.urgency}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => openEdit(selectedNote, e)}
                    className="neo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
                    style={{ color: 'var(--teal)' }}>
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(selectedNote)}
                    className="neo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  <button onClick={() => setSelectedNote(null)}
                    className="neo-btn w-8 h-8 flex items-center justify-center text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient</div>
                  <div className="text-xl font-black text-slate-800">{selectedNote.clinical_note?.patient_name || 'Patient'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chief Complaint</div>
                  <div className="font-serif text-slate-700 leading-relaxed">{selectedNote.clinical_note?.chief_complaint}</div>
                </div>

                {/* Vitals */}
                {(() => {
                  const v = selectedNote.clinical_note?.extracted_vitals;
                  const rows = [
                    ['Temp', v?.temperature_f ? `${v.temperature_f}°F` : null],
                    ['BP',   v?.bp_sys ? `${v.bp_sys}/${v.bp_dia} mmHg` : null],
                    ['Pulse',v?.pulse_bpm ? `${v.pulse_bpm} bpm` : null],
                    ['SpO2', v?.spo2_percent ? `${v.spo2_percent}%` : null],
                    ['Wt',   v?.weight_kg ? `${v.weight_kg} kg` : null],
                  ].filter(r => r[1]) as [string, string][];
                  return rows.length > 0 ? (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vitals</div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {rows.map(([lbl, val]) => (
                          <div key={lbl} className="p-2.5 rounded-xl text-center"
                            style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-inset)' }}>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">{lbl}</div>
                            <div className="text-xs font-black text-slate-700 font-mono mt-0.5">{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Narrative Note</div>
                  <div className="p-4 rounded-xl font-serif text-slate-700 text-sm leading-relaxed"
                    style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-inset)' }}>
                    {selectedNote.clinical_note?.narrative_note}
                  </div>
                </div>

                {selectedNote.amendments && selectedNote.amendments.length > 0 && (
                  <div className="p-3.5 rounded-xl space-y-2"
                    style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-inset)' }}>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Edit History</div>
                    {selectedNote.amendments.map(amd => (
                      <div key={amd.id} className="text-[11px] text-slate-500 font-mono">
                        {new Date(amd.amended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {amd.reason || amd.field}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end" style={{ borderTop: '1px solid rgba(163,177,198,0.3)' }}>
                <button onClick={() => setSelectedNote(null)}
                  className="neo-btn px-5 py-2 text-xs font-bold text-slate-600">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editingNote && editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,30,40,0.75)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-xl animate-scale-in overflow-y-auto"
            style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-lg)', borderRadius: '1.5rem', maxHeight: '92dvh' }}>
            <div className="p-6 space-y-5">

              {/* Header */}
              <div className="flex items-center justify-between pb-4"
                style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
                <div>
                  <h2 className="text-lg font-display text-slate-800">Edit Register Entry</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    NOTE #{editingNote.note_id.slice(-6)} · by {currentStaff.name}
                  </p>
                </div>
                <button onClick={() => { setEditingNote(null); setEditDraft(null); }}
                  className="neo-btn w-8 h-8 flex items-center justify-center text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Fields */}
              <div className="space-y-4">

                {/* Patient name */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                    Patient Name *
                  </label>
                  <input type="text" value={editDraft.patient_name}
                    onChange={e => setEditDraft(d => d ? { ...d, patient_name: e.target.value } : d)}
                    className="neo-input w-full px-4 py-2.5 text-sm text-slate-800" />
                </div>

                {/* Chief complaint */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                    Chief Complaint *
                  </label>
                  <input type="text" value={editDraft.chief_complaint}
                    onChange={e => setEditDraft(d => d ? { ...d, chief_complaint: e.target.value } : d)}
                    className="neo-input w-full px-4 py-2.5 text-sm text-slate-800" />
                </div>

                {/* Urgency + Next Step side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                      Priority
                    </label>
                    <select value={editDraft.urgency}
                      onChange={e => setEditDraft(d => d ? { ...d, urgency: e.target.value as any } : d)}
                      className="neo-input w-full px-3 py-2.5 text-sm text-slate-800">
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="URGENT">URGENT</option>
                      <option value="ROUTINE">ROUTINE</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                      Next Step
                    </label>
                    <select value={editDraft.next_step}
                      onChange={e => setEditDraft(d => d ? { ...d, next_step: e.target.value } : d)}
                      className="neo-input w-full px-3 py-2.5 text-xs text-slate-800">
                      {NEXT_STEPS.map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Narrative note */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5 block">
                    Narrative Note
                  </label>
                  <textarea rows={5} value={editDraft.narrative_note}
                    onChange={e => setEditDraft(d => d ? { ...d, narrative_note: e.target.value } : d)}
                    className="neo-input w-full px-4 py-2.5 text-sm text-slate-800 leading-relaxed resize-none" />
                </div>

                {saveError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium text-rose-700"
                    style={{ background: 'rgba(220,38,38,0.08)', boxShadow: 'var(--neo-shadow-sm)' }}>
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {saveError}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid rgba(163,177,198,0.3)' }}>
                <button onClick={() => { setEditingNote(null); setEditDraft(null); }}
                  className="neo-btn px-5 py-2.5 text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="neo-btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                  {saving ? <span className="animate-spin">⏳</span> : <Check className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,30,40,0.75)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-sm animate-scale-in"
            style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-lg)', borderRadius: '1.5rem' }}>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(220,38,38,0.1)', boxShadow: 'var(--neo-shadow-sm)' }}>
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Delete this entry?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">This cannot be undone.</p>
                </div>
              </div>

              {/* Patient summary */}
              <div className="p-3.5 rounded-xl"
                style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-inset)' }}>
                <div className="font-bold text-slate-800 text-sm">
                  {deleteConfirm.clinical_note?.patient_name || 'Patient'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {deleteConfirm.clinical_note?.chief_complaint}
                </div>
                <div className="mt-1.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded text-white"
                    style={{ background: urgencyColor(deleteConfirm.urgency) }}>
                    {deleteConfirm.urgency}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="neo-btn flex-1 py-2.5 text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '4px 4px 10px rgba(220,38,38,0.35)' }}>
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
