export type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'ROUTINE';

export type NextStep =
  | 'REFER_TO_MO_NOW'
  | 'FLAG_FOR_MO_THIS_SESSION'
  | 'RECORD_IN_REGISTER'
  | 'SCHEDULE_FOLLOW_UP'
  | 'NEEDS_MORE_INFORMATION';

export type RegisterCategory =
  | 'OPD_GENERAL'
  | 'MATERNAL'
  | 'CHILD_HEALTH'
  | 'NCD'
  | 'COMMUNICABLE_DISEASE'
  | 'INJURY'
  | 'MENTAL_HEALTH'
  | 'OTHER';

export type NoteStatus = 'DRAFT' | 'SIGNED' | 'AMENDED';

export interface Vitals {
  temperature_c?: number | null;
  temperature_f?: number | null;
  bp_sys?: number | null;
  bp_dia?: number | null;
  pulse_bpm?: number | null;
  respiratory_rate?: number | null;
  spo2_percent?: number | null;
  blood_sugar_mgdl?: number | null;
  weight_kg?: number | null;
}

export interface TermMapping {
  heard: string;
  documented_as: string;
}

export interface EscalationFlag {
  observation: string;
  observation_en?: string;
  evidence: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface MissingField {
  field: string;
  question_english: string;
  question?: string;
  changes_priority: boolean;
}

export interface NotePayload {
  meta: {
    detected_language: string;
    detected_language_name?: string;
    language_confidence: number;
    input_quality: 'GOOD' | 'PARTIAL' | 'INSUFFICIENT';
    term_normalisation: TermMapping[];
    unmapped_terms: string[];
    unclear_values?: string[];
  };
  queue_priority: {
    urgency_level: UrgencyLevel;
    risk_score_1_to_10: number;
    confidence: number;
    see_within?: 'NOW' | 'THIS_SESSION' | 'NORMAL_QUEUE';
    next_step: NextStep;
    priority_rationale: string;
    priority_rationale_en?: string;
  };
  clinical_note: {
    patient_name?: string;
    age_years?: number | null;
    chief_complaint: string;
    chief_complaint_en?: string;
    symptom_duration: string;
    onset?: 'SUDDEN' | 'GRADUAL' | 'UNKNOWN';
    progression?: 'WORSENING' | 'STABLE' | 'IMPROVING' | 'UNKNOWN';
    extracted_vitals: Vitals;
    key_observations: string[];
    reported_history: string[];
    narrative_note: string;
    narrative_note_en?: string;
    register_category: RegisterCategory;
  };
  escalation: {
    escalate_to_medical_officer: boolean;
    mental_health_flag?: boolean;
    flags: EscalationFlag[];
  };
  missing_fields: MissingField[];
  spoken_confirmation: {
    text_in_detected_language: string;
    text_in_english?: string;
    text?: string;
    language_code: string;
    tone?: 'CALM' | 'ALERT' | 'URGENT';
  };
}

export interface ClinicalNote {
  note_id: string;
  created_at: string;
  status: NoteStatus;
  signed_at?: string | null;
  raw_input: string;
  input_lang?: string;
  urgency: UrgencyLevel;
  next_step: NextStep;
  nurse_id: string;
  facility_id: string;
  latency_ms?: number;
  // Payload contains the full structured note schema
  meta: NotePayload['meta'];
  queue_priority: NotePayload['queue_priority'];
  clinical_note: NotePayload['clinical_note'];
  escalation: NotePayload['escalation'];
  missing_fields: NotePayload['missing_fields'];
  spoken_confirmation: NotePayload['spoken_confirmation'];
  amendments?: NoteAmendment[];
}

export interface NoteAmendment {
  id: string;
  note_id: string;
  amended_at: string;
  nurse_id: string;
  field: string;
  old_value: string;
  new_value: string;
  reason?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  facilityId: string;
  facilityName: string;
  pin: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolCallSummary?: string;
}
