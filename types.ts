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

export interface Doctor {
  id: string;
  name: string;
  specialty: Specialty;
  experience: number;
  rating: number;
  nextAvailable: string;
  price: number;
  image: string;
}

export interface User {
  username: string;
  phone: string;
  fullName: string;
}

export interface Booking {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorImage: string;
  specialty: string;
  date: string;
  status: 'Chờ khám' | 'Đã hoàn thành' | 'Đã hủy';
  timestamp: Date;
}
