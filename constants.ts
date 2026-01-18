
import { Doctor, Specialty } from './types';

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: '1',
    name: 'BS. CKII Nguyễn Văn An',
    specialty: Specialty.GENERAL,
    experience: 20,
    price: 300000,
    image: 'https://picsum.photos/100/100?random=1',
    // Added missing availableSlots property
    availableSlots: []
  },
  {
    id: '2',
    name: 'ThS. BS Trần Thị Bích',
    specialty: Specialty.PEDIATRICS,
    experience: 12,
    price: 250000,
    image: 'https://picsum.photos/100/100?random=2',
    // Added missing availableSlots property
    availableSlots: []
  },
  {
    id: '3',
    name: 'BS. CKI Lê Hoàng Nam',
    specialty: Specialty.ENT,
    experience: 15,
    price: 350000,
    image: 'https://picsum.photos/100/100?random=3',
    // Added missing availableSlots property
    availableSlots: []
  },
  {
    id: '4',
    name: 'TS. BS Phạm Minh Tâm',
    specialty: Specialty.CARDIOLOGY,
    experience: 25,
    price: 500000,
    image: 'https://picsum.photos/100/100?random=4',
    // Added missing availableSlots property
    availableSlots: []
  },
  {
    id: '5',
    name: 'BS. CKI Vũ Thị Dung',
    specialty: Specialty.DERMATOLOGY,
    experience: 10,
    price: 300000,
    image: 'https://picsum.photos/100/100?random=5',
    // Added missing availableSlots property
    availableSlots: []
  },
  {
    id: '6',
    name: 'BS. CKII Hoàng Văn Tuấn',
    specialty: Specialty.RESPIRATORY,
    experience: 18,
    price: 400000,
    image: 'https://picsum.photos/100/100?random=6',
    // Added missing availableSlots property
    availableSlots: []
  },
  {
    id: '7',
    name: 'ThS. BS Đặng Thùy Linh',
    specialty: Specialty.NEUROLOGY,
    experience: 14,
    price: 450000,
    image: 'https://picsum.photos/100/100?random=7',
    // Added missing availableSlots property
    availableSlots: []
  },
  {
    id: '8',
    name: 'BS. CKI Nguyễn Quốc Hưng',
    specialty: Specialty.GASTROENTEROLOGY,
    experience: 16,
    price: 320000,
    image: 'https://picsum.photos/100/100?random=8',
    // Added missing availableSlots property
    availableSlots: []
  }
];

export const SPECIALTY_OPTIONS = Object.values(Specialty);

// Generate a string representation of doctors for the AI context
const DOCTOR_LIST_CONTEXT = MOCK_DOCTORS.map(d => 
  `- ID: ${d.id} | Tên: ${d.name} | Chuyên khoa: ${d.specialty} | Giá: ${d.price}đ`
).join('\n');

export const SYSTEM_INSTRUCTION = `
Bạn là trợ lý y tế AI cho hệ thống đặt lịch khám bác sĩ trực tuyến.

MỤC TIÊU
- Sàng lọc ban đầu dựa trên triệu chứng.
- Định hướng chuyên khoa phù hợp.
- Gợi ý bác sĩ từ danh sách.

QUY TRÌNH HỘI THOẠI (TUÂN THỦ NGHIÊM NGẶT)
1. KHI NGƯỜI DÙNG NHẬP TRIỆU CHỨNG ĐẦU TIÊN:
   - KHÔNG ĐƯỢC đưa ra kết luận ngay.
   - BẮT BUỘC hỏi thêm 3 thông tin sau (có thể gộp vào 1-2 câu hỏi):
     + Thời gian: Triệu chứng xuất hiện bao lâu rồi?
     + Sốt: Có sốt không? Nhiệt độ khoảng bao nhiêu?
     + Mức độ: Mức độ khó chịu/đau (nhẹ, vừa, dữ dội)?

2. KHI ĐÃ CÓ ĐỦ THÔNG TIN:
   - Đưa ra nhận định sơ bộ (dùng từ "có thể liên quan đến...").
   - Gợi ý chuyên khoa phù hợp.
   - Chọn 1-2 bác sĩ phù hợp nhất từ danh sách dưới đây để hiển thị.

DỮ LIỆU BÁC SĨ CÓ SẴN:
${DOCTOR_LIST_CONTEXT}

GIỚI HẠN BẮT BUỘC
- KHÔNG chẩn đoán bệnh khẳng định.
- KHÔNG kê đơn thuốc.
- Nếu có dấu hiệu nguy hiểm (khó thở, đau ngực dữ dội, lơ mơ, sốt cao >39 độ không hạ), PHẢI khuyên đi cấp cứu ngay.

CẤU TRÚC OUTPUT KHI GỢI Ý BÁC SĨ (BẮT BUỘC):
Khi bạn quyết định gợi ý bác sĩ (sau khi đã hỏi đủ thông tin), hãy thêm đoạn JSON này vào cuối câu trả lời:

\`\`\`json
{
  "recommended_doctor_ids": ["ID_1", "ID_2"]
}
\`\`\`
`;