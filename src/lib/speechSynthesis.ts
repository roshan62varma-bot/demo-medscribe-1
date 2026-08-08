// Text-To-Speech playback helper in active native language

export function speakText(text: string, langCode: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  // Cancel any ongoing speech
  try {
    window.speechSynthesis.cancel();
  } catch (e) {}

  if (!text || text.trim() === '') return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode || 'en-IN';

  // Find matching voice if available
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const cleanLang = langCode.toLowerCase();
    const primaryLang = cleanLang.split('-')[0];

    const exactMatch = voices.find(v => v.lang.toLowerCase() === cleanLang);
    const langMatch = voices.find(v => v.lang.toLowerCase().startsWith(primaryLang));

    if (exactMatch) {
      utterance.voice = exactMatch;
    } else if (langMatch) {
      utterance.voice = langMatch;
    }
  }

  utterance.rate = 0.95;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}
