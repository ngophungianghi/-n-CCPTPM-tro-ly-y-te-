
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  recommendedDoctorIds?: string[];
}

export enum Specialty {
  GENERAL = 'Đa khoa',
  ENT = 'Tai Mũi Họng',
  DERMATOLOGY = 'Da liễu',
  PEDIATRICS = 'Nhi khoa',
  CARDIOLOGY = 'Tim mạch',
  NEUROLOGY = 'Thần kinh',
  GASTROENTEROLOGY = 'Tiêu hóa',
  RESPIRATORY = 'Hô hấp'
}

export interface AvailableSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export interface Doctor {
  id: string;
  name: string;
  specialty: Specialty;
  experience: number;
  price: number;
  image: string;
  availableSlots: AvailableSlot[]; // Lịch rảnh do Admin thiết lập
  userPhone?: string; // SĐT tài khoản user tương ứng (để map login)
}

export interface User {
  id?: string;
  username: string;
  phone: string;
  fullName: string;
  password?: string;
  role: 'admin' | 'customer' | 'doctor';
}

export interface Booking {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorImage: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Chờ khám' | 'Đã xác nhận' | 'Đã hoàn thành' | 'Đã hủy';
  userPhone: string;
  userFullName: string;
  timestamp: Date;
  aiSummary?: string; // Tóm tắt triệu chứng từ AI
}
