
import { Doctor, Booking } from "../types";
import { MOCK_DOCTORS } from "../constants";

// LOCAL STORAGE KEY
const STORAGE_KEY = 'care_ai_bookings';

// --- SERVICE HOÀN TOÀN CHẠY TRÊN TRÌNH DUYỆT (Offline-first) ---

export const fetchDoctors = async (): Promise<Doctor[]> => {
  // Giả lập độ trễ mạng cực thấp để tạo cảm giác mượt mà
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_DOCTORS), 100);
  });
};

export const saveBooking = async (bookingData: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const currentData = localStorage.getItem(STORAGE_KEY);
        const localBookings = currentData ? JSON.parse(currentData) : [];
        
        const newBooking = {
          ...bookingData,
          id: 'booking_' + Date.now(),
          timestamp: new Date().toISOString() // Lưu dưới dạng chuỗi ISO để an toàn
        };
        
        // Thêm mới vào đầu danh sách
        const updatedBookings = [newBooking, ...localBookings];
        
        // Lưu vĩnh viễn vào trình duyệt
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBookings));
        
        console.log("Đã lưu lịch hẹn thành công:", newBooking);
        resolve(newBooking.id);
      } catch (error) {
        console.error("Lỗi lưu dữ liệu:", error);
        resolve(null);
      }
    }, 500); // Giả lập xử lý server
  });
};

export const fetchUserBookings = async (phone: string): Promise<Booking[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
       try {
        const currentData = localStorage.getItem(STORAGE_KEY);
        const localBookings = currentData ? JSON.parse(currentData) : [];
        
        const userBookings = localBookings
          .filter((b: any) => b.userPhone === phone)
          .map((b: any) => ({
            ...b,
            // Quan trọng: Chuyển đổi chuỗi thời gian trở lại đối tượng Date để React hiển thị đúng
            timestamp: new Date(b.timestamp)
          }));
          
        resolve(userBookings);
       } catch (error) {
         console.error("Lỗi đọc dữ liệu:", error);
         resolve([]);
       }
    }, 300);
  });
};
