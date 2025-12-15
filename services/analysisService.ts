import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Message, SystemicAnalysisData, DeepInsight, Language } from "../types";

const getSystemicAnalysisInstruction = (lang: Language) => `
Eres un analista de datos sistémicos basado en la teoría de "Lealtades Invisibles".
Tu tarea es analizar la conversación y extraer datos estructurados JSON para visualizar el sistema familiar.
NO respondas como terapeuta, solo devuelve JSON.
${lang === 'en' ? "PROVIDE ALL TEXT DESCRIPTIONS IN ENGLISH." : "PROVEE TODAS LAS DESCRIPCIONES DE TEXTO EN ESPAÑOL."}

1. GENOGRAMA (Mermaid.js):
   - Crea un gráfico 'graph TD'.
   - Usa nodos cuadrados para hombres [Nombre] y redondos para mujeres ((Nombre)).
   - Usa líneas sólidas '---' para relaciones neutrales/matrimonios.
   - Usa líneas punteadas '-.-' para lealtades invisibles.
   - Usa líneas gruesas '===' para relaciones muy cercanas/fusionadas.
   - IMPORTANTE: Si hay conflicto, añade un estilo de link rojo.

2. LIBRO MAYOR (Ledger):
   - Meritos: Lo que el usuario dio, cuidó, sufrió o se le negó injustamente.
   - Deudas: Lo que el usuario recibió, debe, o daño que causó.

3. SENTIMIENTOS:
   - Analiza la emoción cuando se menciona a familiares (Padre, Madre, Pareja, etc.).
`;

const getInsightInstruction = (lang: Language) => `
Actúa como un supervisor clínico experto en Boszormenyi-Nagy.
Analiza la transcripción y genera 3 puntos clave profundos.
${lang === 'en' ? "OUTPUT IN ENGLISH." : "OUTPUT IN SPANISH."}

1. La Lealtad Invisible detectada (¿A quién es leal el usuario secretamente?).
2. La Deuda Impaga (¿Qué balance está pendiente en el sistema?).
3. Acción Reparadora (Un movimiento ético concreto para equilibrar la balanza).
Sé directo, profundo y sistémico.
`;

const getClient = () => {
    if (!process.env.API_KEY) throw new Error("API Key missing");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeSystemicData = async (messages: Message[], lang: Language = 'es'): Promise<SystemicAnalysisData | null> => {
  try {
    const ai = getClient();
    
    const conversationHistory = messages.map(m => `${m.role}: ${m.text}`).join('\n');

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        genogramMermaid: { type: Type.STRING, description: "Mermaid.js graph definition string (graph TD...)" },
        ledger: {
            type: Type.OBJECT,
            properties: {
                merits: { 
                    type: Type.ARRAY, 
                    items: { 
                        type: Type.OBJECT, 
                        properties: {
                            description: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['merit'] },
                            value: { type: Type.NUMBER }
                        } 
                    } 
                },
                debts: { 
                    type: Type.ARRAY, 
                    items: { 
                        type: Type.OBJECT, 
                        properties: {
                            description: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['debt'] },
                            value: { type: Type.NUMBER }
                        } 
                    } 
                }
            }
        },
        sentiments: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    member: { type: Type.STRING },
                    sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative', 'conflict'] },
                    score: { type: Type.NUMBER }
                }
            }
        }
      },
      required: ["genogramMermaid", "ledger", "sentiments"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analiza esta conversación y extrae los datos sistémicos:\n\n${conversationHistory}`,
        config: {
            systemInstruction: getSystemicAnalysisInstruction(lang),
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    if (response.text) {
        return JSON.parse(response.text) as SystemicAnalysisData;
    }
    return null;
  } catch (error) {
    console.error("Analysis Error:", error);
    return null;
  }
};

export const generateDeepInsight = async (messages: Message[], lang: Language = 'es'): Promise<DeepInsight | null> => {
    try {
        const ai = getClient();
        const conversationHistory = messages.map(m => `${m.role}: ${m.text}`).join('\n');

        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                loyalty: { type: Type.STRING },
                debt: { type: Type.STRING },
                action: { type: Type.STRING }
            },
            required: ["loyalty", "debt", "action"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Genera un insight clínico profundo de esta sesión:\n\n${conversationHistory}`,
            config: {
                systemInstruction: getInsightInstruction(lang),
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as DeepInsight;
        }
        return null;
    } catch (error) {
        console.error("Insight Error:", error);
        return null;
    }
};
