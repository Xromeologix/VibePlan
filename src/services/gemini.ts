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
    
    let text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    // Strip markdown formatting if present
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function processBlurt(transcript: string, currentSpaceName?: string) {
  const prompt = `
  The user just "blurted" a stream of consciousness: "${transcript}".
  
  ${currentSpaceName ? `They are currently inside a workspace called "${currentSpaceName}". Assume they want to add a feature to this workspace unless they explicitly say they want to create a new app/project.` : `They are on the main dashboard. Assume they want to create a new app/project/workspace.`}
  
  Analyze the text. 
  If they are describing a new app/project, return a "space" object. 
  If they are describing a feature/module, return an "idea" object.
  
  Return ONLY valid JSON in this exact format. IMPORTANT: Escape all newlines in the mermaid string as \\n.
  {
    "type": "space" | "idea",
    "data": {
      // ONLY IF type="space"
      "name": "...", 
      "platform": "Lovable" | "Base44" | "FlutterFlow" | "Custom", 
      "color": "Indigo" | "Emerald" | "Rose" | "Amber" | "Violet", 
      
      // ONLY IF type="idea"
      "title": "...", 
      "summary": "...", 
      "mermaid": "graph TD\\n...", 
      "type": "UI" | "Logic" | "API" | "Module", 
      "personas": { 
        "ux": { "score": 85, "comment": "..." }, 
        "pm": { "score": 90, "comment": "..." }, 
        "tech": { "score": 70, "comment": "..." } 
      }
    }
  }
  `;
  return await callGemini(prompt, "You are an expert product architect. Return valid JSON only. Do not include markdown formatting.");
}

export async function generateIcon(prompt: string, stylePrompt?: string) {
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const customStyle = stylePrompt ? ` Style details: ${stylePrompt}.` : " Style: Modern, minimalist, vector style, flat design.";
    const response = await ai.models.generateContent({
      model: imageModelName,
      contents: {
        parts: [{ text: `A clean, professional, high-quality icon for a project management tool. Subject: ${prompt}.${customStyle}` }]
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
