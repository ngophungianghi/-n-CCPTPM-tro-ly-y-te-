
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
        temperature: 0.4, 
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
  summary?: string;
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
    let summary: string | undefined;

    // 1. XỬ LÝ SUMMARY TAG [SUMMARY: ...]
    const summaryMatch = text.match(/\[SUMMARY:(.*?)\]/);
    if (summaryMatch) {
        summary = summaryMatch[1].trim();
        // Xóa tag summary khỏi văn bản hiển thị
        text = text.replace(/\[SUMMARY:.*?\]/g, '').trim();
    }

    // 2. XỬ LÝ ACTION TAG [ACTION:SHOW_BOOKING_LINK:...]
    const actionMatch = text.match(/\[ACTION:SHOW_BOOKING_LINK:(.*?)\]/);
    
    if (actionMatch) {
      const specialtyName = actionMatch[1].trim();
      
      // Lọc danh sách bác sĩ theo chuyên khoa mà AI đề xuất
      const matchingDoctors = currentDoctors.filter(d => 
        d.specialty.toLowerCase() === specialtyName.toLowerCase()
      );

      if (matchingDoctors.length > 0) {
        recommendedDoctorIds = matchingDoctors.map(d => d.id);
      } else {
        console.warn(`Không tìm thấy bác sĩ cho chuyên khoa: ${specialtyName}`);
      }

      // Xóa tag action khỏi văn bản hiển thị
      text = text.replace(/\[ACTION:SHOW_BOOKING_LINK:.*?\]/g, '').trim();
    } 
    // 3. LOGIC CŨ (FALLBACK): XỬ LÝ JSON (Giữ lại để tương thích ngược nếu AI lỡ trả về JSON)
    else {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*?"recommended_doctor_ids"[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const jsonString = jsonMatch[1] || jsonMatch[0];
          const data = JSON.parse(jsonString);
          if (data.recommended_doctor_ids && Array.isArray(data.recommended_doctor_ids)) {
            recommendedDoctorIds = data.recommended_doctor_ids.filter((id: string) => 
              currentDoctors.some(d => d.id === id)
            );
          }
          text = text.replace(/```json[\s\S]*?```/g, '').replace(/\{[\s\S]*?"recommended_doctor_ids"[\s\S]*?\}/g, '').trim();
        } catch (e) {
          console.warn("AI returned invalid JSON recommendation:", e);
        }
      }
    }

    return { text, recommendedDoctorIds, summary };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Không thể kết nối với hệ thống AI.");
  }
};
