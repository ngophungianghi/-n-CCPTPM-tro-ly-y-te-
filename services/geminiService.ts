import { GoogleGenAI, Chat } from "@google/genai";
import { getSystemInstruction } from '../constants';
import { Doctor } from "../types";

// QUAN TRỌNG: Không khởi tạo ai ở global scope để tránh lỗi crash nếu thiếu key
let chatSession: Chat | null = null;
let currentDoctors: Doctor[] = [];

export const initializeChat = async (doctors: Doctor[]) => {
  try {
    // Theo guidelines: API key phải được lấy từ process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // Thử khởi tạo lại nếu chưa có session
    await initializeChat([]);
  }

  if (!chatSession) {
    // Trả về thông báo lỗi thân thiện thay vì crash ứng dụng
    return { 
        text: "Hệ thống AI chưa được kết nối (Thiếu API Key). Vui lòng kiểm tra cấu hình.",
        recommendedDoctorIds: [] 
    };
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
        text = text.replace(/\[SUMMARY:.*?\]/g, '').trim();
    }

    // 2. XỬ LÝ ACTION TAG [ACTION:SHOW_BOOKING_LINK:...]
    const actionMatch = text.match(/\[ACTION:SHOW_BOOKING_LINK:(.*?)\]/);
    
    if (actionMatch) {
      const specialtyName = actionMatch[1].trim();
      const matchingDoctors = currentDoctors.filter(d => 
        d.specialty.toLowerCase() === specialtyName.toLowerCase()
      );

      if (matchingDoctors.length > 0) {
        recommendedDoctorIds = matchingDoctors.map(d => d.id);
      }
      text = text.replace(/\[ACTION:SHOW_BOOKING_LINK:.*?\]/g, '').trim();
    } 
    // 3. LOGIC CŨ (FALLBACK)
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
    return { text: "Có lỗi khi kết nối với AI. Vui lòng thử lại sau.", recommendedDoctorIds: [] };
  }
};