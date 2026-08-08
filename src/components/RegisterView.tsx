import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ClinicalNote } from '../types';
import {
  Download,
  Printer,
  Search,
  BookOpen,
  Clock,
  ChevronRight,
  X,
  MessageSquareText,
  FileText
} from 'lucide-react';

interface RegisterViewProps {
  signedNotes: ClinicalNote[];
  onOpenChatbot: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  signedNotes,
  onOpenChatbot,
}) => {
  const { t } = useLanguage();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'URGENT' | 'ROUTINE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);

  // Filter notes
  const filteredNotes = signedNotes.filter((note) => {
    if (activeFilter !== 'ALL' && note.urgency !== activeFilter) {
      return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const ptName = (note.clinical_note?.patient_name || '').toLowerCase();
      const complaint = (note.clinical_note?.chief_complaint || '').toLowerCase();
      const raw = (note.raw_input || '').toLowerCase();

      if (!ptName.includes(q) && !complaint.includes(q) && !raw.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const totalLines = signedNotes.length;
  const criticalCount = signedNotes.filter((n) => n.urgency === 'CRITICAL').length;
  const urgentCount = signedNotes.filter((n) => n.urgency === 'URGENT').length;
  const routineCount = signedNotes.filter((n) => n.urgency === 'ROUTINE').length;

  const handleExportCSV = () => {
    if (signedNotes.length === 0) return;

    const headers = ['Line No', 'Date', 'Time', 'Patient Name', 'Age', 'Chief Complaint', 'BP', 'Pulse', 'Temp', 'SpO2', 'Priority', 'Next Step'];
    const rows = signedNotes.map((n, idx) => [
      idx + 1,
      n.signed_at ? new Date(n.signed_at).toLocaleDateString() : '',
      n.signed_at ? new Date(n.signed_at).toLocaleTimeString() : '',
      `"${n.clinical_note?.patient_name || 'Patient'}"`,
      n.clinical_note?.age_years || '',
      `"${(n.clinical_note?.chief_complaint || '').replace(/"/g, '""')}"`,
      n.clinical_note?.extracted_vitals?.bp_sys ? `${n.clinical_note.extracted_vitals.bp_sys}/${n.clinical_note.extracted_vitals.bp_dia}` : '',
      n.clinical_note?.extracted_vitals?.pulse_bpm || '',
      n.clinical_note?.extracted_vitals?.temperature_f || '',
      n.clinical_note?.extracted_vitals?.spo2_percent || '',
      n.urgency,
      n.next_step,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Medscribe_OPD_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintRegister = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-900/30 pb-4">
        <div>
          <div className="text-[11px] font-bold tracking-widest text-teal-700 dark:text-teal-400 uppercase">
            {t('register.breadcrumb')}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            {t('register.heading')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {t('register.subheading')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d5c63] hover:bg-[#09484e] text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-[#2dd4bf]" />
            <span>{t('register.exportButton')}</span>
          </button>

          <button
            onClick={handlePrintRegister}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>{t('register.printButton')}</span>
          </button>

          <button
            onClick={onOpenChatbot}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#451a03] text-xs font-black shadow-md transition-colors"
          >
            <MessageSquareText className="w-4 h-4" />
            <span>{t('register.askAssistant')}</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('register.totalLines')}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">{totalLines}</div>
        </div>

        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-sm">
          <div className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">{t('register.criticalCount')}</div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono mt-1">{criticalCount}</div>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 shadow-sm">
          <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">{t('register.urgentCount')}</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono mt-1">{urgentCount}</div>
        </div>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">{t('register.routineCount')}</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">{routineCount}</div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        
        {/* Priority Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'CRITICAL', 'URGENT', 'ROUTINE'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeFilter === filter
                  ? 'bg-[#0d5c63] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {t(`register.filter.${filter.toLowerCase()}`)}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('register.search')}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

      </div>

      {/* Ruled Paper Ledger Table */}
      <div className="bg-amber-50/40 dark:bg-slate-900 rounded-2xl border-2 border-emerald-900/30 shadow-md overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d5c63] text-white text-[11px] font-bold tracking-wider uppercase border-b-2 border-[#09484e]">
                <th className="py-3 px-4 w-12 text-center">{t('register.col.no')}</th>
                <th className="py-3 px-4">{t('register.col.patient')}</th>
                <th className="py-3 px-4">{t('register.col.vitals')}</th>
                <th className="py-3 px-4 text-center">{t('register.col.priority')}</th>
                <th className="py-3 px-4">{t('register.col.time')}</th>
                <th className="py-3 px-4">{t('register.col.nextStep')}</th>
                <th className="py-3 px-4 text-right">{t('register.col.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/10 text-xs">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>{t('register.empty')}</span>
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note, idx) => {
                  const vitals = note.clinical_note?.extracted_vitals;
                  const vitalsStr = [
                    vitals?.temperature_f ? `${vitals.temperature_f}°F` : null,
                    vitals?.bp_sys ? `${vitals.bp_sys}/${vitals.bp_dia}` : null,
                    vitals?.pulse_bpm ? `${vitals.pulse_bpm}bpm` : null,
                    vitals?.spo2_percent ? `SpO2 ${vitals.spo2_percent}%` : null,
                  ].filter(Boolean).join(' · ');

                  return (
                    <tr
                      key={note.note_id}
                      onClick={() => setSelectedNote(note)}
                      className="hover:bg-amber-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      {/* Serial Number */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>

                      {/* Patient Name & Chief Complaint */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {note.clinical_note?.patient_name || 'Patient'}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 font-serif line-clamp-1 mt-0.5">
                          {note.clinical_note?.chief_complaint}
                        </div>
                      </td>

                      {/* Vitals */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {vitalsStr || '—'}
                      </td>

                      {/* Priority Stamp Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-[10px] font-black tracking-wider uppercase shadow-sm ${
                            note.urgency === 'CRITICAL'
                              ? 'bg-rose-700 text-white'
                              : note.urgency === 'URGENT'
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-700 text-white'
                          }`}
                        >
                          {note.urgency}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {note.signed_at
                              ? new Date(note.signed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Next Step */}
                      <td className="py-3.5 px-4 font-semibold text-teal-800 dark:text-teal-300">
                        {t(`nextStep.${note.next_step}`)}
                      </td>

                      {/* Action Chevron */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNote(note);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Note Detail Drawer/Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400">NOTE #{selectedNote.note_id.slice(-6)}</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                    selectedNote.urgency === 'CRITICAL'
                      ? 'bg-rose-700 text-white'
                      : selectedNote.urgency === 'URGENT'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  {selectedNote.urgency}
                </span>
              </div>

              <button
                onClick={() => setSelectedNote(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Patient</span>
                <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {selectedNote.clinical_note?.patient_name || 'Patient'}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Chief Complaint</span>
                <div className="font-serif text-slate-800 dark:text-slate-200 leading-relaxed mt-0.5">
                  {selectedNote.clinical_note?.chief_complaint}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Narrative Note</span>
                <div className="p-3 bg-amber-50/60 dark:bg-slate-800 rounded-xl font-serif text-slate-800 dark:text-slate-200 text-xs leading-relaxed border border-amber-200/80 dark:border-slate-700">
                  {selectedNote.clinical_note?.narrative_note}
                </div>
              </div>

              {/* Amendment Chain Log */}
              {selectedNote.amendments && selectedNote.amendments.length > 0 && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Correction History</div>
                  {selectedNote.amendments.map((amd) => (
                    <div key={amd.id} className="text-[11px] text-slate-500 space-y-0.5 font-mono">
                      <div>Field: {amd.field}</div>
                      <div>Old: "{amd.old_value}" → New: "{amd.new_value}"</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
