
import { Doctor, Booking, User } from "../types";
import { db, storage } from "../firebaseConfig";
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";

/**
 * NÉN ẢNH TRƯỚC KHI UPLOAD
 */
const compressImage = (file: File, maxWidth = 800, maxHeight = 800): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas to Blob failed"));
        }, 'image/jpeg', 0.8);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * UPLOAD HÌNH ẢNH (Có nén)
 */
export const uploadDoctorImage = async (file: File): Promise<string> => {
  if (!storage) throw new Error("Storage chưa được cấu hình");
  
  if (!file.type.startsWith('image/')) {
    throw new Error("Vui lòng chọn file hình ảnh.");
  }

  try {
    const compressedBlob = await compressImage(file);
    const storageRef = ref(storage, `doctors/${Date.now()}_doctor_portrait.jpg`);
    const snapshot = await uploadBytes(storageRef, compressedBlob);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Error in uploadDoctorImage:", error);
    throw error;
  }
};

/**
 * QUẢN LÝ USER (AUTH)
 */
export const registerUser = async (user: User): Promise<boolean> => {
  if (!db) return false;
  try {
    const userRef = doc(db, "users", user.phone);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) return false;

    await setDoc(userRef, {
      phone: user.phone,
      username: user.username,
      fullName: user.fullName,
      password: user.password,
      role: user.role,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    return false;
  }
};

export const loginUser = async (phone: string, password: string): Promise<User | null> => {
  if (!db) return null;
  try {
    const userRef = doc(db, "users", phone);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as User;
      if (userData.password === password) return userData;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const fetchAllUsers = async (): Promise<User[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, "users"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ phone: doc.id, ...doc.data() } as User));
  } catch (e) {
    return [];
  }
};

export const updateUserRole = async (phone: string, newRole: 'admin' | 'customer' | 'doctor'): Promise<boolean> => {
  if (!db) return false;
  try {
    const userRef = doc(db, "users", phone);
    await updateDoc(userRef, { role: newRole });
    return true;
  } catch (e) {
    console.error("Error updating user role:", e);
    return false;
  }
};

/**
 * QUẢN LÝ BÁC SĨ
 */
export const fetchDoctors = async (): Promise<Doctor[]> => {
  if (!db) return [];
  try {
    const querySnapshot = await getDocs(collection(db, "doctors"));
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Doctor));
  } catch (e) {
    console.error("Error fetching doctors:", e);
    return [];
  }
};

export const saveDoctor = async (doctor: Partial<Doctor>): Promise<void> => {
  if (!db) return;
  try {
    if (doctor.id) {
      const docRef = doc(db, "doctors", doctor.id);
      const data = { ...doctor };
      delete data.id;
      await updateDoc(docRef, data);
    } else {
      await addDoc(collection(db, "doctors"), {
        ...doctor,
        createdAt: serverTimestamp()
      });
    }
  } catch (e) {
    throw e;
  }
};

export const deleteDoctor = async (id: string): Promise<void> => {
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng");
  if (!id) throw new Error("ID bác sĩ không hợp lệ để xóa");
  
  try {
    const docRef = doc(db, "doctors", id);
    await deleteDoc(docRef);
    console.log(`Doctor with ID ${id} deleted from Firestore`);
  } catch (e) {
    console.error("Database error while deleting doctor:", e);
    throw e;
  }
};

/**
 * QUẢN LÝ LỊCH HẸN
 */
export const checkAvailability = async (doctorId: string, date: string): Promise<string[]> => {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "bookings"),
      where("doctorId", "==", doctorId),
      where("date", "==", date),
      // Fix: Check both Pending AND Confirmed status
      where("status", "in", ["Chờ khám", "Đã xác nhận"])
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().time);
  } catch (e) {
    return [];
  }
};

export const saveBooking = async (bookingData: any): Promise<string | null> => {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, "bookings"), {
      ...bookingData,
      status: 'Chờ khám',
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    return null;
  }
};

export const fetchUserBookings = async (phone: string): Promise<Booking[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, "bookings"), where("userPhone", "==", phone));
    const snap = await getDocs(q);
    const results = snap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(), 
      timestamp: doc.data().timestamp?.toDate() || new Date() 
    } as Booking));
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (e) {
    return [];
  }
};

export const fetchAllBookings = async (): Promise<Booking[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, "bookings"));
    const snap = await getDocs(q);
    const results = snap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(), 
      timestamp: doc.data().timestamp?.toDate() || new Date() 
    } as Booking));
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (e) {
    return [];
  }
};

export const updateBookingStatus = async (bookingId: string, newStatus: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const docRef = doc(db, "bookings", bookingId);
    await updateDoc(docRef, { status: newStatus });
    return true;
  } catch (e) {
    return false;
  }
};
