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
    if (current.trim() !== value) onSave(current.trim());
  };

  const handleCancel = () => {
    setCurrent(value);
    setEditing(false);
  };

  return (
    <div
      className={`group relative p-3.5 transition-all duration-200 ${className}`}
      style={{
        background: 'var(--neo-bg)',
        boxShadow: editing
          ? 'inset 4px 4px 8px rgba(163,177,198,0.5), inset -3px -3px 7px rgba(255,255,255,0.85), 0 0 0 2px rgba(13,92,99,0.2)'
          : 'inset 3px 3px 6px rgba(163,177,198,0.45), inset -2px -2px 5px rgba(255,255,255,0.8)',
        borderRadius: '0.75rem',
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          {label}
        </label>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
            style={{
              background: 'var(--neo-bg)',
              boxShadow: 'var(--neo-shadow-sm)',
              color: 'var(--teal)',
            }}
            title="Edit field"
            aria-label="Edit field"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
            className="neo-input flex-1 px-3 py-1.5 text-sm font-medium text-slate-800"
          />
          <button
            onClick={handleSave}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: 'linear-gradient(135deg, #0f6b73, #0d5c63)',
              color: 'white',
              boxShadow: '3px 3px 6px rgba(13,92,99,0.3)',
            }}
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCancel}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: 'var(--neo-bg)',
              color: 'var(--text-muted)',
              boxShadow: 'var(--neo-shadow-sm)',
            }}
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="cursor-pointer text-sm font-medium transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          {value || <span style={{ color: 'var(--text-muted)' }}>—</span>}
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
    if (current.trim() !== value) onSave(current.trim());
  };

  const handleCancel = () => {
    setCurrent(value);
    setEditing(false);
  };

  return (
    <div
      className={`group relative p-3.5 transition-all duration-200 ${className}`}
      style={{
        background: 'var(--neo-bg)',
        boxShadow: editing
          ? 'inset 4px 4px 8px rgba(163,177,198,0.5), inset -3px -3px 7px rgba(255,255,255,0.85), 0 0 0 2px rgba(13,92,99,0.2)'
          : 'inset 3px 3px 6px rgba(163,177,198,0.45), inset -2px -2px 5px rgba(255,255,255,0.8)',
        borderRadius: '0.75rem',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          {label}
        </label>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
            style={{
              background: 'var(--neo-bg)',
              boxShadow: 'var(--neo-shadow-sm)',
              color: 'var(--teal)',
            }}
            title="Edit narrative note"
            aria-label="Edit narrative note"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            rows={5}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoFocus
            className="neo-input w-full px-3 py-2 text-sm text-slate-800 leading-relaxed resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleCancel}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all"
              style={{
                background: 'var(--neo-bg)',
                color: 'var(--text-muted)',
                boxShadow: 'var(--neo-shadow-sm)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, #0f6b73, #0d5c63)',
                color: 'white',
                boxShadow: '3px 3px 8px rgba(13,92,99,0.3)',
              }}
            >
              <Check className="w-3.5 h-3.5" />
              Save edits
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="cursor-pointer text-sm leading-relaxed whitespace-pre-wrap transition-colors"
          style={{ color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}
        >
          {value || <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </div>
      )}
    </div>
  );
};
