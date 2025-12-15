import { GoogleGenAI, Chat } from "@google/genai";
import { getSystemInstruction } from "../constants";
import { Language } from "../types";

let chatSession: Chat | null = null;
let currentLang: Language = 'es';

export const initializeChat = (lang: Language = 'es') => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  currentLang = lang;
  
  // Using gemini-2.5-flash for speed and conversational ability as per guidelines
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getSystemInstruction(lang),
      temperature: 0.7, // Balance between empathy and analytical rigidity
      maxOutputTokens: 300, // Force conciseness
    },
  });
};

export const sendMessageToGemini = async (message: string, lang: Language = 'es'): Promise<string> => {
  // If language changed or session not exists, re-init
  if (!chatSession || currentLang !== lang) {
    try {
      initializeChat(lang);
    } catch (error) {
      return lang === 'en' 
        ? "Error: Could not initialize connection with the specialist. Check configuration."
        : "Error: No se pudo inicializar la conexión con el especialista. Verifique la configuración.";
    }
  }

  if (!chatSession) {
    return "Error de inicialización.";
  }

  try {
    const result = await chatSession.sendMessage({
      message: message
    });
    
    return result.text || (lang === 'en' ? "I'm sorry, I couldn't analyze that. Could you rephrase?" : "Lo siento, no pude analizar esa respuesta. ¿Podrías reformularlo?");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return lang === 'en'
      ? "Sorry, there was a connection interruption. Please try again."
      : "Lo siento, hubo una interrupción en nuestra conexión. Por favor intenta de nuevo.";
  }
};