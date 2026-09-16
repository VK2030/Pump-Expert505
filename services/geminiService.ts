
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Strictly follow guideline: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getEducationalResponse = async (moduleTitle: string, question: string) => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    Ты - эксперт-технолог по добыче нефти и эксперт конкурса "Лучший по профессии".
    Помогай пользователю готовиться к конкурсу по теме: ${moduleTitle}.
    Отвечай кратко, профессионально, на русском языке.
    Используй термины: ЭЦН (электроцентробежный насос), дебит, напор, пластовое давление, газовый фактор, солеотложение.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: question }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    // Property .text returns the string output.
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Произошла ошибка при получении данных. Попробуйте позже.";
  }
};
