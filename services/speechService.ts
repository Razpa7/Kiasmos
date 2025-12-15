import { Language } from "../types";

// Helper for Speech Recognition (Speech-to-Text)
export class SpeechRecognitionService {
  recognition: any = null;
  isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.isSupported = true;
      }
    }
  }

  start(lang: Language, onResult: (text: string, isFinal: boolean) => void, onEnd: () => void) {
    if (!this.recognition) return;
    
    this.recognition.lang = lang === 'en' ? 'en-US' : 'es-ES';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      onEnd();
    };

    this.recognition.onend = () => {
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error("Recognition already started", e);
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

// Helper for Speech Synthesis (Text-to-Speech)
export const speakText = (text: string, lang: Language = 'es', onEnd?: () => void) => {
  if (!('speechSynthesis' in window)) return;

  // Cancel any current speaking
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'en' ? 'en-US' : 'es-ES';
  
  // Try to make it sound like a "serious male specialist"
  // 1. Lower pitch slightly
  utterance.pitch = 0.8; 
  // 2. Normal to slightly slow rate for clarity
  utterance.rate = 1.0; 

  // Attempt to select a male voice if available
  const voices = window.speechSynthesis.getVoices();
  const keywords = lang === 'en' 
    ? ['male', 'david', 'james', 'google us english'] 
    : ['male', 'hombre', 'jorge', 'pablo', 'raul', 'google español'];
  
  const preferredVoice = voices.find(voice => {
    // Check if lang matches
    if (!voice.lang.includes(lang === 'en' ? 'en' : 'es')) return false;
    
    // Check for male keywords in the voice name
    return keywords.some(keyword => voice.name.toLowerCase().includes(keyword));
  });

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
