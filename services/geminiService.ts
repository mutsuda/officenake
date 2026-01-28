
import { GoogleGenAI } from "@google/genai";

export async function getBossCommentary(event: string, playerName: string, score: number): Promise<string> {
  try {
    // Inicialización dinámica para evitar fallos si process.env no está listo en el top-level
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context - Event: ${event}, Employee: ${playerName}, Current KPI: ${score}`,
      config: {
        systemInstruction: "You are an annoying but funny corporate boss. Generate a short, snarky one-sentence comment for a company multiplayer game. Use corporate buzzwords like 'synergy', 'paradigm shift', 'low-hanging fruit', 'circle back', 'as per my last email'. Keep it under 15 words.",
        temperature: 0.9,
        topP: 0.95,
      }
    });

    return response.text?.trim() || "Let's touch base on your performance later.";
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "Back to work, everyone!";
  }
}
