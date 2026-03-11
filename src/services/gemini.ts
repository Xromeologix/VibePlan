import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const modelName = "gemini-3-flash-preview";
const imageModelName = "gemini-2.5-flash-image";

export async function callGemini(payload: string, systemPrompt: string) {
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: payload,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateIcon(prompt: string) {
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: imageModelName,
      contents: {
        parts: [{ text: `A clean, professional, high-quality icon for a project management tool. Subject: ${prompt}. Style: Modern, minimalist, vector style, flat design.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data in response");
  } catch (error) {
    console.error("Gemini Image Error:", error);
    throw error;
  }
}
