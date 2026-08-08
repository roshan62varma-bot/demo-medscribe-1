import { ClinicalNote } from '../types';

const OFFLINE_NOTES_KEY = 'medscribe_signed_notes_v1';
const PENDING_QUEUE_KEY = 'medscribe_pending_queue_v1';
const BASELINE_KEY = 'medscribe_baseline_seconds';

export const getHandwrittenBaseline = (): number => {
  const val = localStorage.getItem(BASELINE_KEY);
  return val ? parseInt(val, 10) : 270; // Default 270 seconds (4.5 minutes)
};

export const setHandwrittenBaseline = (seconds: number): void => {
  localStorage.setItem(BASELINE_KEY, String(seconds));
};

export const getLocalSignedNotes = (): ClinicalNote[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveLocalSignedNote = (note: ClinicalNote): void => {
  try {
    const existing = getLocalSignedNotes();
    const updated = [note, ...existing.filter(n => n.note_id !== note.note_id)];
    localStorage.setItem(OFFLINE_NOTES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save signed note locally:', e);
  }
};

export const getPendingQueue = (): any[] => {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const addToPendingQueue = (draft: any): void => {
  try {
    const queue = getPendingQueue();
    queue.push(draft);
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {}
};

export const clearPendingQueue = (): void => {
  localStorage.removeItem(PENDING_QUEUE_KEY);
};
