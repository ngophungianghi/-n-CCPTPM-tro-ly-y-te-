
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  recommendedDoctorIds?: string[];
  aiSummary?: string; // Tóm tắt triệu chứng được sinh ra bởi AI
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

export interface Medication {
  name: string;
  dosage: string; // e.g., "1 viên"
  frequency: string; // e.g., "Sáng, Tối"
  duration: string; // e.g., "5 ngày"
  notes?: string;
}

export interface Prescription {
  medications: Medication[];
  note: string;
  reExamDate?: string; // YYYY-MM-DD
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
  prescription?: Prescription; // Đơn thuốc do bác sĩ kê
  needsInpatient?: boolean; // Cần nhập viện
  isAdmitted?: boolean; // Đã nhập viện
}

export interface Bed {
  id: string;
  bedNumber: string;
  status: 'available' | 'occupied';
}

export interface BedAssignment {
  id: string;
  bedId: string;
  patientId: string;
  patientName: string;
  diagnosis: string;
  startTime: string;
  expectedEndTime: string;
  status: 'active' | 'discharged';
  isEmergency?: boolean;
}
