import React, { useState } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onSave,
  className = '',
}) => {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(value);

  const handleSave = () => {
    setEditing(false);
    if (current.trim() !== value) {
      onSave(current.trim());
    }
  };

  const handleCancel = () => {
    setCurrent(value);
    setEditing(false);
  };

  return (
    <div className={`group relative bg-amber-50/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          {label}
        </label>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="opacity-60 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 p-1"
            title="Edit field"
            aria-label="Edit field"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
            className="flex-1 bg-white dark:bg-slate-900 border border-teal-500 rounded px-2 py-1 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
          />
          <button
            onClick={handleSave}
            className="p-1 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
            title="Save edit"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-300 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-100 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
        >
          {value || '—'}
        </div>
      )}
    </div>
  );
};

export const EditableTextarea: React.FC<EditableFieldProps> = ({
  label,
  value,
  onSave,
  className = '',
}) => {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(value);

  const handleSave = () => {
    setEditing(false);
    if (current.trim() !== value) {
      onSave(current.trim());
    }
  };

  const handleCancel = () => {
    setCurrent(value);
    setEditing(false);
  };

  return (
    <div className={`group relative bg-amber-50/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          {label}
        </label>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="opacity-60 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 p-1"
            title="Edit narrative note"
            aria-label="Edit narrative note"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-1">
          <textarea
            rows={4}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoFocus
            className="w-full bg-white dark:bg-slate-900 border border-teal-500 rounded p-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-medium hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Save edits
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="cursor-pointer text-sm font-serif leading-relaxed text-slate-800 dark:text-slate-200 hover:text-teal-800 dark:hover:text-teal-300 whitespace-pre-wrap"
        >
          {value || '—'}
        </div>
      )}
    </div>
  );
};
