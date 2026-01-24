
import { GoogleGenAI, Chat } from "@google/genai";
import { getSystemInstruction } from '../constants';
import { Doctor } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatSession: Chat | null = null;
let currentDoctors: Doctor[] = [];

export const initializeChat = async (doctors: Doctor[]) => {
  try {
    currentDoctors = doctors;
    const doctorContext = doctors.length > 0 
      ? doctors.map(d => `- ID: ${d.id} | Tên: ${d.name} | Chuyên khoa: ${d.specialty} | Kinh nghiệm: ${d.experience} năm | Phí: ${d.price}đ`).join('\n')
      : "Hiện chưa có bác sĩ nào sẵn sàng trong hệ thống.";

    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: getSystemInstruction(doctorContext),
        temperature: 0.4, // Giảm temperature để AI phản hồi ổn định hơn
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
    await initializeChat([]);
  }

  if (!chatSession) {
    throw new Error("Chat session not ready.");
  }

  try {
    const response = await chatSession.sendMessage({ message });
    let text = response.text || "Xin lỗi, tôi gặp sự cố khi xử lý phản hồi.";
    let recommendedDoctorIds: string[] | undefined;

    // Regex mạnh mẽ hơn để bắt khối JSON gợi ý bác sĩ
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*?"recommended_doctor_ids"[\s\S]*?\}/);
    
    if (jsonMatch) {
      try {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        const data = JSON.parse(jsonString);
        
        if (data.recommended_doctor_ids && Array.isArray(data.recommended_doctor_ids)) {
          // Chỉ lấy các ID thực sự tồn tại trong currentDoctors
          recommendedDoctorIds = data.recommended_doctor_ids.filter((id: string) => 
            currentDoctors.some(d => d.id === id)
          );
        }
        
        // Làm sạch văn bản hiển thị cho người dùng (loại bỏ phần JSON)
        text = text.replace(/```json[\s\S]*?```/g, '').replace(/\{[\s\S]*?"recommended_doctor_ids"[\s\S]*?\}/g, '').trim();
      } catch (e) {
        console.warn("AI returned invalid JSON recommendation:", e);
      }
    }

    return { text, recommendedDoctorIds };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Không thể kết nối với hệ thống AI.");
  }
};
