// registerChatEngine.ts
// Rule-based register query engine — works fully offline without any AI API key.
// Handles natural language questions about today's OPD signed register.

export interface RegisterNote {
  line_no: number;
  note_id: string;
  patient_name: string;
  age_years: number | null;
  urgency: string;
  chief_complaint: string;
  narrative_note: string;
  symptom_duration: string;
  next_step: string;
  signed_at: string;
  vitals: {
    temp_f: number | null;
    bp: string | null;
    bp_sys?: number | null;
    bp_dia?: number | null;
    pulse_bpm: number | null;
    spo2_percent: number | null;
    weight_kg: number | null;
  };
  escalation_flags: string[];
  amendments_count: number;
}

// ── Multilingual keyword banks ────────────────────────────────────────────

const KW = {
  critical:   /\b(critical|गंभीर|அவசரம்|गंभीर|گمبھیر|গুরুতর|ತೀವ್ರ|ഗുരുതര|ਗੰਭੀਰ|गंभीर|गुरुतर|ক্রিটিকাল)\b/i,
  urgent:     /\b(urgent|तत्काल|உடனடி|فوری|জরুরি|ತುರ್ತು|അടിയന്തിര|ਤੁਰੰਤ|तत्काल|जरुरी)\b/i,
  routine:    /\b(routine|सामान्य|வழக்கமான|سامان|সাধারণ|ಸಾಮಾನ್ಯ|സാധാരണ|ਸਧਾਰਨ|नियमित)\b/i,
  fever:      /\b(fever|bukhar|jerom|jvara|बुखार|ज्वर|காய்ச்சல்|جبخار|জ্বর|ಜ್ವರ|ജ്വരം|ਬੁਖਾਰ|ଜ୍ୱ)\b/i,
  bp:         /\b(bp|blood.?pressure|ब्लड.?प्रेशर|रक्त.?चाप|రక్తపోటు|রক్తচাப|ರಕ್ತದೊತ್ತಡ|rakta|pressure)\b/i,
  spo2:       /\b(spo2|oxygen|saturation|o2|oximeter|ऑक्सीजन|প্রাণবায়ু|ऑक्सी)\b/i,
  pulse:      /\b(pulse|heart.?rate|bpm|नाड़ी|नाडी|pulse|拍)\b/i,
  temp:       /\b(temp|temperature|fever|degrees?|°|ताप|तापमान|thermometer)\b/i,
  vitals:     /\b(vitals?|vital.?signs?|वाइटल|vital)\b/i,
  weight:     /\b(weight|kg|wt|वजन|எடை|ওজন|ತೂಕ|ഭാരം|ਭਾਰ)\b/i,
  summary:    /\b(summary|report|overview|shift|total|today|आज|आज का|सारांश|சுருக்கம்|আজ)\b/i,
  count:      /\b(how many|count|number|कितने|எத்தனை|কত|ఎంత|किती|how much)\b/i,
  list:       /\b(list|all|show|display|who|patients?|everyone|सभी|அனைத்தும்|সকলে|అందరూ)\b/i,
  last:       /\b(last|latest|recent|most.?recent|आखिर|கடைசி|শেষ|చివరి|end)\b/i,
  first:      /\b(first|earliest|शुरुआत|முதல்|প্রথম|మొదటి|start)\b/i,
  referral:   /\b(referral|refer|slip|letter|refer.?now|பரிந்துரை|রেফার|రిఫెరల్|ਰੈਫਰਲ)\b/i,
  narrative:  /\b(note|notes?|narrative|story|detail|full.?note|read.?back|tell.?me.?about|نوٹ|টোকা|నోట్)\b/i,
  nextStep:   /\b(next.?step|action|what.?to.?do|अगला|அடுத்த|পরবর্তী|తదుపరి)\b/i,
  escalation: /\b(escalat|flag|alert|warn|danger|risk|எச்சரிக்கை|সতর্কতা|హెచ్చరిక)\b/i,
  edited:     /\b(edit|amend|chang|correct|修正|संशोधन|திருத்தம்|সংশোধন|సవరణ)\b/i,
  diarrhea:   /\b(diarrhea|diarrhoea|loose.?motion|stomach|vomit|potty|दस्त|उल्टी|வயிற்றுப்போக்கு)\b/i,
  breathless: /\b(breathless|saans|dyspnoea|breathing|chest|oxygen|மூச்சு|শ্বাস|శ్వాస)\b/i,
  anc:        /\b(anc|antenatal|pregnant|pregnancy|गर्भवती|கர்ப்பிணி|গর্ভবতী|గర్భిణీ)\b/i,
  child:      /\b(child|baby|infant|kid|paediatric|बच्चा|குழந்தை|শিশু|పిల్లలు)\b/i,
};

function patientCard(n: RegisterNote): string {
  const parts: string[] = [`${n.patient_name}`];
  if (n.age_years) parts.push(`age ${n.age_years}`);
  parts.push(`[${n.urgency}]`);
  return parts.join(', ');
}

function vitalsLine(n: RegisterNote): string {
  const v: string[] = [];
  if (n.vitals.temp_f)     v.push(`Temp ${n.vitals.temp_f}°F`);
  if (n.vitals.bp)         v.push(`BP ${n.vitals.bp}`);
  if (n.vitals.pulse_bpm)  v.push(`Pulse ${n.vitals.pulse_bpm} bpm`);
  if (n.vitals.spo2_percent) v.push(`SpO2 ${n.vitals.spo2_percent}%`);
  if (n.vitals.weight_kg)  v.push(`Wt ${n.vitals.weight_kg} kg`);
  return v.length ? v.join(' · ') : 'No vitals recorded';
}

function referralSlip(n: RegisterNote): string {
  return [
    `--- REFERRAL SLIP ---`,
    `Patient: ${n.patient_name}${n.age_years ? `, Age ${n.age_years}` : ''}`,
    `Complaint: ${n.chief_complaint}`,
    `Duration: ${n.symptom_duration}`,
    `Vitals: ${vitalsLine(n)}`,
    `Priority: ${n.urgency}`,
    `Reason for referral: ${n.escalation_flags.join('; ') || n.chief_complaint}`,
    `Action: ${n.next_step.replace(/_/g, ' ')}`,
    `Signed at: ${n.signed_at}`,
    `--------------------`,
    `(Review and sign before handing over to Medical Officer)`,
  ].join('\n');
}

// ── Main query engine ─────────────────────────────────────────────────────

export function answerRegisterQuery(
  message: string,
  notes: RegisterNote[]
): string {
  const m = message.toLowerCase();
  const total = notes.length;

  if (total === 0) {
    return "No notes signed yet today. Sign patient notes from the Capture screen — they'll appear here and I can answer questions about them.";
  }

  const critical = notes.filter(n => n.urgency === 'CRITICAL');
  const urgent   = notes.filter(n => n.urgency === 'URGENT');
  const routine  = notes.filter(n => n.urgency === 'ROUTINE');

  // ── Check if asking about a specific patient by name ─────────────────────
  const namedPatient = notes.find(n => {
    const parts = n.patient_name.toLowerCase().split(/\s+/);
    return parts.some(p => p.length > 2 && m.includes(p));
  });

  if (namedPatient) {
    // ── Referral slip for named patient ─────────────────────────────────
    if (KW.referral.test(m)) {
      return referralSlip(namedPatient);
    }
    // ── Vitals for named patient ─────────────────────────────────────────
    if (KW.vitals.test(m) || KW.bp.test(m) || KW.spo2.test(m) || KW.temp.test(m) || KW.pulse.test(m)) {
      return `Vitals for ${namedPatient.patient_name}:\n${vitalsLine(namedPatient)}`;
    }
    // ── Full note / narrative ─────────────────────────────────────────────
    if (KW.narrative.test(m) || /note|detail|full|story|about/.test(m)) {
      return [
        `${patientCard(namedPatient)}`,
        `Complaint: ${namedPatient.chief_complaint}`,
        `Duration: ${namedPatient.symptom_duration}`,
        `Vitals: ${vitalsLine(namedPatient)}`,
        namedPatient.escalation_flags.length ? `Flags: ${namedPatient.escalation_flags.join('; ')}` : '',
        `Next step: ${namedPatient.next_step.replace(/_/g, ' ')}`,
        `Signed: ${namedPatient.signed_at}`,
        `\nNarrative:\n${namedPatient.narrative_note}`,
      ].filter(Boolean).join('\n');
    }
    // ── General info about named patient ─────────────────────────────────
    return [
      `${patientCard(namedPatient)}`,
      `Complaint: ${namedPatient.chief_complaint}`,
      `Vitals: ${vitalsLine(namedPatient)}`,
      `Next step: ${namedPatient.next_step.replace(/_/g, ' ')}`,
      namedPatient.escalation_flags.length ? `⚠ Flags: ${namedPatient.escalation_flags.join('; ')}` : '',
      `Signed at ${namedPatient.signed_at}`,
    ].filter(Boolean).join('\n');
  }

  // ── Referral slip — pick first critical/urgent ───────────────────────────
  if (KW.referral.test(m)) {
    const target = critical[0] || urgent[0];
    if (!target) return "No CRITICAL or URGENT patients to refer. All cases are routine.";
    return referralSlip(target);
  }

  // ── SpO2 queries ─────────────────────────────────────────────────────────
  if (KW.spo2.test(m)) {
    const lowO2 = notes.filter(n => n.vitals.spo2_percent !== null && n.vitals.spo2_percent < 95);
    const withO2 = notes.filter(n => n.vitals.spo2_percent !== null);
    if (/low|below|under|poor|danger/.test(m)) {
      return lowO2.length === 0
        ? "No patients with SpO2 below 95% documented today."
        : `${lowO2.length} patient(s) with low SpO2:\n` +
          lowO2.map((n, i) => `${i+1}. ${n.patient_name}: SpO2 ${n.vitals.spo2_percent}%`).join('\n');
    }
    return withO2.length === 0
      ? "No SpO2 readings documented today."
      : `SpO2 recorded for ${withO2.length} patient(s):\n` +
        withO2.map((n, i) => `${i+1}. ${n.patient_name}: ${n.vitals.spo2_percent}%`).join('\n');
  }

  // ── BP queries ────────────────────────────────────────────────────────────
  if (KW.bp.test(m)) {
    const withBP = notes.filter(n => n.vitals.bp);
    const highBP = notes.filter(n => n.vitals.bp_sys !== null && (n.vitals.bp_sys as number) > 140);
    if (/high|above|elevated|hyper/.test(m)) {
      return highBP.length === 0
        ? "No patients with BP above 140 documented today."
        : `${highBP.length} patient(s) with high BP:\n` +
          highBP.map((n, i) => `${i+1}. ${n.patient_name}: ${n.vitals.bp}`).join('\n');
    }
    return withBP.length === 0
      ? "No blood pressure readings documented today."
      : `BP documented for ${withBP.length} patient(s):\n` +
        withBP.map((n, i) => `${i+1}. ${n.patient_name}: ${n.vitals.bp}`).join('\n');
  }

  // ── Temperature / fever by vitals ─────────────────────────────────────────
  if (KW.temp.test(m) && !/complain|story/.test(m)) {
    const withTemp = notes.filter(n => n.vitals.temp_f !== null);
    const highTemp = notes.filter(n => n.vitals.temp_f !== null && (n.vitals.temp_f as number) > 99.5);
    if (/high|fever|elevated/.test(m)) {
      return highTemp.length === 0
        ? "No patients with recorded fever (>99.5°F) today."
        : `${highTemp.length} patient(s) with elevated temperature:\n` +
          highTemp.map((n, i) => `${i+1}. ${n.patient_name}: ${n.vitals.temp_f}°F`).join('\n');
    }
    return withTemp.length === 0
      ? "No temperature readings documented today."
      : `Temperature recorded for ${withTemp.length} patient(s):\n` +
        withTemp.map((n, i) => `${i+1}. ${n.patient_name}: ${n.vitals.temp_f}°F`).join('\n');
  }

  // ── Pulse ─────────────────────────────────────────────────────────────────
  if (KW.pulse.test(m)) {
    const withPulse = notes.filter(n => n.vitals.pulse_bpm !== null);
    return withPulse.length === 0
      ? "No pulse readings documented today."
      : `Pulse recorded for ${withPulse.length} patient(s):\n` +
        withPulse.map((n, i) => `${i+1}. ${n.patient_name}: ${n.vitals.pulse_bpm} bpm`).join('\n');
  }

  // ── All vitals summary ────────────────────────────────────────────────────
  if (KW.vitals.test(m)) {
    return notes.map((n, i) => `${i+1}. ${n.patient_name} — ${vitalsLine(n)}`).join('\n');
  }

  // ── Fever cases (by complaint text) ──────────────────────────────────────
  if (KW.fever.test(m)) {
    const feverCases = notes.filter(n => KW.fever.test(n.chief_complaint));
    return feverCases.length === 0
      ? "No fever cases documented in today's register."
      : `${feverCases.length} fever case(s) today:\n` +
        feverCases.map((n, i) => `${i+1}. ${n.patient_name} (${n.urgency}) — ${n.chief_complaint}`).join('\n');
  }

  // ── Diarrhea / stomach ────────────────────────────────────────────────────
  if (KW.diarrhea.test(m)) {
    const cases = notes.filter(n => KW.diarrhea.test(n.chief_complaint));
    return cases.length === 0
      ? "No diarrhea or stomach cases today."
      : `${cases.length} diarrhea/stomach case(s):\n` +
        cases.map((n, i) => `${i+1}. ${n.patient_name} — ${n.chief_complaint}`).join('\n');
  }

  // ── Breathing / chest ─────────────────────────────────────────────────────
  if (KW.breathless.test(m)) {
    const cases = notes.filter(n => KW.breathless.test(n.chief_complaint));
    return cases.length === 0
      ? "No breathing or chest complaints today."
      : `${cases.length} breathing/chest case(s):\n` +
        cases.map((n, i) => `${i+1}. ${n.patient_name} (${n.urgency}) — ${n.chief_complaint}`).join('\n');
  }

  // ── ANC / maternal ────────────────────────────────────────────────────────
  if (KW.anc.test(m)) {
    const cases = notes.filter(n => KW.anc.test(n.chief_complaint) || n.chief_complaint.toLowerCase().includes('maternal'));
    return cases.length === 0
      ? "No ANC/maternal cases today."
      : `${cases.length} ANC/maternal case(s):\n` +
        cases.map((n, i) => `${i+1}. ${n.patient_name} — ${n.chief_complaint}`).join('\n');
  }

  // ── Child / pediatric ─────────────────────────────────────────────────────
  if (KW.child.test(m)) {
    const cases = notes.filter(n => n.age_years !== null && (n.age_years as number) < 12);
    return cases.length === 0
      ? "No pediatric patients (under 12) today."
      : `${cases.length} pediatric patient(s):\n` +
        cases.map((n, i) => `${i+1}. ${n.patient_name}, age ${n.age_years} — ${n.chief_complaint}`).join('\n');
  }

  // ── Critical patients ─────────────────────────────────────────────────────
  if (KW.critical.test(m)) {
    return critical.length === 0
      ? "No CRITICAL patients today. All cases are Urgent or Routine."
      : `${critical.length} CRITICAL patient(s):\n` +
        critical.map((n, i) => `${i+1}. ${n.patient_name} — ${n.chief_complaint}\n   Flags: ${n.escalation_flags.join('; ') || 'none'}\n   Vitals: ${vitalsLine(n)}`).join('\n\n');
  }

  // ── Urgent patients ───────────────────────────────────────────────────────
  if (KW.urgent.test(m)) {
    return urgent.length === 0
      ? "No URGENT patients today."
      : `${urgent.length} URGENT patient(s):\n` +
        urgent.map((n, i) => `${i+1}. ${n.patient_name} — ${n.chief_complaint}`).join('\n');
  }

  // ── Routine patients ──────────────────────────────────────────────────────
  if (KW.routine.test(m)) {
    return routine.length === 0
      ? "No ROUTINE patients today."
      : `${routine.length} ROUTINE patient(s):\n` +
        routine.map((n, i) => `${i+1}. ${n.patient_name} — ${n.chief_complaint}`).join('\n');
  }

  // ── Escalation / alerts ───────────────────────────────────────────────────
  if (KW.escalation.test(m)) {
    const flagged = notes.filter(n => n.escalation_flags.length > 0);
    return flagged.length === 0
      ? "No escalation flags today."
      : `${flagged.length} patient(s) with escalation flags:\n` +
        flagged.map((n, i) => `${i+1}. ${n.patient_name} (${n.urgency}): ${n.escalation_flags.join('; ')}`).join('\n');
  }

  // ── Edited / amended notes ────────────────────────────────────────────────
  if (KW.edited.test(m)) {
    const edited = notes.filter(n => n.amendments_count > 0);
    return edited.length === 0
      ? "No notes were edited today — all were signed as drafted."
      : `${edited.length} note(s) were edited before signing:\n` +
        edited.map((n, i) => `${i+1}. ${n.patient_name} (${n.amendments_count} edit${n.amendments_count > 1 ? 's' : ''})`).join('\n');
  }

  // ── Next steps ────────────────────────────────────────────────────────────
  if (KW.nextStep.test(m)) {
    return `Next steps for all patients:\n` +
      notes.map((n, i) => `${i+1}. ${n.patient_name}: ${n.next_step.replace(/_/g, ' ')}`).join('\n');
  }

  // ── Patients needing MO ───────────────────────────────────────────────────
  if (/mo|medical officer|doctor|डॉक्टर|মেডিকেল অফিসার/.test(m)) {
    const needsMO = notes.filter(n =>
      n.next_step === 'REFER_TO_MO_NOW' || n.next_step === 'FLAG_FOR_MO_THIS_SESSION'
    );
    return needsMO.length === 0
      ? "No patients flagged for Medical Officer today."
      : `${needsMO.length} patient(s) need Medical Officer attention:\n` +
        needsMO.map((n, i) => `${i+1}. ${n.patient_name} (${n.urgency}) — ${n.next_step.replace(/_/g, ' ')}: ${n.chief_complaint}`).join('\n');
  }

  // ── Last / most recent patient ────────────────────────────────────────────
  if (KW.last.test(m)) {
    const last = notes[notes.length - 1];
    return `Last signed entry:\n${patientCard(last)}\nComplaint: ${last.chief_complaint}\nVitals: ${vitalsLine(last)}\nSigned at ${last.signed_at}`;
  }

  // ── First patient ─────────────────────────────────────────────────────────
  if (KW.first.test(m)) {
    const first = notes[0];
    return `First signed entry:\n${patientCard(first)}\nComplaint: ${first.chief_complaint}\nVitals: ${vitalsLine(first)}\nSigned at ${first.signed_at}`;
  }

  // ── List all patients ─────────────────────────────────────────────────────
  if (KW.list.test(m)) {
    return `Today's ${total} signed patient(s):\n` +
      notes.map((n, i) => `${i+1}. ${n.patient_name} (${n.urgency}) — ${n.chief_complaint}`).join('\n');
  }

  // ── Count / how many ─────────────────────────────────────────────────────
  if (KW.count.test(m)) {
    return `Today's register: ${total} total — ${critical.length} Critical, ${urgent.length} Urgent, ${routine.length} Routine.`;
  }

  // ── Summary / shift report ────────────────────────────────────────────────
  if (KW.summary.test(m)) {
    const withEscalation = notes.filter(n => n.escalation_flags.length > 0);
    const needsMO = notes.filter(n =>
      n.next_step === 'REFER_TO_MO_NOW' || n.next_step === 'FLAG_FOR_MO_THIS_SESSION'
    );
    return [
      `Shift Summary — ${total} signed entries`,
      `${critical.length} Critical · ${urgent.length} Urgent · ${routine.length} Routine`,
      critical.length > 0 ? `Critical patients: ${critical.map(n => n.patient_name).join(', ')}` : '',
      `${needsMO.length} patient(s) flagged for Medical Officer`,
      `${withEscalation.length} escalation flag(s) raised`,
      `Time range: ${notes[0]?.signed_at || '—'} → ${notes[total-1]?.signed_at || '—'}`,
    ].filter(Boolean).join('\n');
  }

  // ── Default: search complaints for any word match ─────────────────────────
  const words = m.split(/\s+/).filter(w => w.length > 3);
  for (const word of words) {
    const matches = notes.filter(n =>
      n.chief_complaint.toLowerCase().includes(word) ||
      n.narrative_note.toLowerCase().includes(word)
    );
    if (matches.length > 0) {
      return `Found ${matches.length} patient(s) matching "${word}":\n` +
        matches.map((n, i) => `${i+1}. ${n.patient_name} (${n.urgency}) — ${n.chief_complaint}`).join('\n');
    }
  }

  // ── Absolute fallback ─────────────────────────────────────────────────────
  return (
    `Today's register: ${total} entries — ${critical.length} Critical, ${urgent.length} Urgent, ${routine.length} Routine.\n\n` +
    `You can ask me:\n` +
    `• A patient's name (e.g. "Tell me about Ramesh")\n` +
    `• Urgency ("who is critical?", "list urgent patients")\n` +
    `• Vitals ("show BP", "who has low SpO2?")\n` +
    `• Summary ("shift summary")\n` +
    `• Referral ("draft referral slip")`
  );
}
