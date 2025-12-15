import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { getSystemInstruction } from "../constants";
import { Language } from "../types";
import { arrayBufferToBase64, base64ToUint8Array, decodeAudioData, float32ToInt16, downsampleBuffer } from "../utils/audio";

export interface LiveConfig {
  language: Language;
  onOpen: () => void;
  onClose: () => void;
  onMessage: (text: string, role: 'user' | 'model') => void;
  onError: (error: Error) => void;
}

export class GeminiLiveService {
  private client: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime: number = 0;
  private sessionPromise: Promise<any> | null = null;
  private isConnected: boolean = false;
  private currentStream: MediaStream | null = null;
  
  // Buffers for transcription
  private currentInputTranscript: string = "";
  private currentOutputTranscript: string = "";

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API Key missing");
    }
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(config: LiveConfig) {
    if (this.isConnected) return;

    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      this.currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          systemInstruction: getSystemInstruction(config.language),
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } 
          },
          // Enable transcription to sync with Chat UI
          inputAudioTranscription: { model: "gemini-2.5-flash" },
          outputAudioTranscription: { model: "gemini-2.5-flash" },
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            this.isConnected = true;
            this.currentInputTranscript = "";
            this.currentOutputTranscript = "";
            this.startAudioInput();
            config.onOpen();
          },
          onmessage: async (msg: LiveServerMessage) => {
            this.handleServerMessage(msg, config);
          },
          onclose: () => {
            console.log("Gemini Live Closed");
            this.disconnect();
            config.onClose();
          },
          onerror: (err) => {
            console.error("Gemini Live Error", err);
            config.onError(new Error("Connection error"));
          }
        }
      });
      
    } catch (error: any) {
      console.error("Failed to start live session:", error);
      config.onError(error);
      this.disconnect();
    }
  }

  private startAudioInput() {
    if (!this.inputAudioContext || !this.currentStream || !this.sessionPromise) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.currentStream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const currentSampleRate = this.inputAudioContext?.sampleRate || 16000;

      const downsampledData = downsampleBuffer(inputData, currentSampleRate, 16000);
      const int16Data = float32ToInt16(downsampledData);
      const base64Data = arrayBufferToBase64(int16Data.buffer);

      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({
          media: {
            mimeType: "audio/pcm;rate=16000",
            data: base64Data
          }
        });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleServerMessage(message: LiveServerMessage, config: LiveConfig) {
    const { serverContent } = message;
    if (!serverContent) return;

    // 1. Audio Output
    const modelTurn = serverContent.modelTurn;
    if (modelTurn?.parts?.[0]?.inlineData) {
      const audioData = modelTurn.parts[0].inlineData.data;
      if (audioData && this.outputAudioContext) {
        await this.playAudioChunk(base64ToUint8Array(audioData));
      }
    }

    // 2. Interruption
    if (serverContent.interrupted) {
      this.stopAudioPlayback();
      this.currentOutputTranscript = ""; // Clear stale output text
    }

    // 3. Transcription Handling (Sync with UI)
    // User Input Transcription
    if (serverContent.inputTranscription?.text) {
        this.currentInputTranscript += serverContent.inputTranscription.text;
    }

    // Model Output Transcription
    if (serverContent.outputTranscription?.text) {
        this.currentOutputTranscript += serverContent.outputTranscription.text;
    }

    // Turn Complete: Commit the transcriptions to the UI
    if (serverContent.turnComplete) {
        if (this.currentInputTranscript.trim()) {
            config.onMessage(this.currentInputTranscript, 'user');
            this.currentInputTranscript = "";
        }
        if (this.currentOutputTranscript.trim()) {
            config.onMessage(this.currentOutputTranscript, 'model');
            this.currentOutputTranscript = "";
        }
    }
  }

  private async playAudioChunk(data: Uint8Array) {
    if (!this.outputAudioContext) return;
    this.nextStartTime = Math.max(this.outputAudioContext.currentTime, this.nextStartTime);
    const audioBuffer = await decodeAudioData(data, this.outputAudioContext);
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination);
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  private stopAudioPlayback() {
    if (this.outputAudioContext) {
        this.nextStartTime = this.outputAudioContext.currentTime;
    }
  }

  disconnect() {
    this.isConnected = false;
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
    this.inputSource?.disconnect();
    this.processor?.disconnect();
    this.inputSource = null;
    this.processor = null;
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.sessionPromise = null;
  }
}

export const liveService = new GeminiLiveService();