
import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Chat instead of deprecated ChatSession
let chatSession: Chat | null = null;

export const initializeChat = async () => {
  try {
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
        topK: 40,
        topP: 0.95,
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    return false;
  }
};

interface GeminiResponse {
  text: string;
  recommendedDoctorIds?: string[];
}

export const sendMessageToGemini = async (message: string): Promise<GeminiResponse> => {
  if (!chatSession) {
    await initializeChat();
  }

  if (!chatSession) {
    throw new Error("Chat session could not be initialized.");
  }

  try {
    // response.text is a property, not a method
    const response = await chatSession.sendMessage({ message });
    let text = response.text || "Xin lỗi, tôi gặp sự cố khi xử lý phản hồi. Vui lòng thử lại.";
    let recommendedDoctorIds: string[] | undefined;

    // Improved JSON extraction regex: Matches JSON block even if there are extra newlines or messy markdown
    const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    
    if (jsonMatch) {
      try {
        // Clean up any potential trailing commas or comments if necessary (JSON.parse is strict)
        const jsonString = jsonMatch[1];
        const data = JSON.parse(jsonString);
        
        if (data.recommended_doctor_ids && Array.isArray(data.recommended_doctor_ids)) {
          recommendedDoctorIds = data.recommended_doctor_ids;
        }
        
        // Remove the JSON block from the text shown to user
        text = text.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.warn("Failed to parse recommendation JSON from AI response:", e);
        // We do not throw here, simply return the text without recommendations
      }
    }

    return { text, recommendedDoctorIds };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Không thể kết nối với hệ thống AI.");
  }
};
