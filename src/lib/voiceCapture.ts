// voiceCapture.ts — single guarded Web Speech API capture helper

let activeRecognitionInstance: any = null;

export interface VoiceCaptureCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, confidence: number | null) => void;
  onError?: (errorCode: string) => void;
  onEnd?: () => void;
}

export function startVoiceCapture(
  languageBCP47: string,
  callbacks: VoiceCaptureCallbacks
): any | null {
  // Discard any existing session before starting a new one
  if (activeRecognitionInstance) {
    try {
      activeRecognitionInstance.onresult = null;
      activeRecognitionInstance.onerror = null;
      activeRecognitionInstance.onend = null;
      activeRecognitionInstance.abort();
    } catch (e) {
      // ignore abort errors
    }
    activeRecognitionInstance = null;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    callbacks.onError?.('BROWSER_UNSUPPORTED');
    return null;
  }

  const recognition = new SpeechRecognition();

  // Settings to fix duplicate word bug & ensure correct language capture
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.lang = languageBCP47 || 'en-IN';

  let hasFiredResult = false;

  recognition.onstart = () => {
    hasFiredResult = false;
    callbacks.onStart?.();
  };

  recognition.onresult = (event: any) => {
    if (hasFiredResult) return; // Guard against duplicate callback triggers
    hasFiredResult = true;

    if (event.results && event.results.length > 0) {
      const lastResultIndex = event.results.length - 1;
      const resultObj = event.results[lastResultIndex][0];
      const text = resultObj.transcript ? resultObj.transcript.trim() : '';
      const confidence = typeof resultObj.confidence === 'number' ? resultObj.confidence : null;

      try {
        recognition.stop();
      } catch (e) {}

      callbacks.onResult?.(text, confidence);
    }
  };

  recognition.onerror = (event: any) => {
    hasFiredResult = true;
    const errName = event.error || 'unknown';
    callbacks.onError?.(errName);
  };

  recognition.onend = () => {
    activeRecognitionInstance = null;
    callbacks.onEnd?.();
  };

  activeRecognitionInstance = recognition;

  try {
    recognition.start();
  } catch (err: any) {
    activeRecognitionInstance = null;
    callbacks.onError?.(err?.message || 'start_failed');
    return null;
  }

  return recognition;
}

export function stopVoiceCapture(): void {
  if (activeRecognitionInstance) {
    try {
      activeRecognitionInstance.stop();
    } catch (e) {}
    activeRecognitionInstance = null;
  }
}
