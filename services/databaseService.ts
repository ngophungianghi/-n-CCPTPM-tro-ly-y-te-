
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
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

/**
 * UPLOAD HÌNH ẢNH
 */
export const uploadDoctorImage = async (file: File): Promise<string> => {
  if (!storage) throw new Error("Storage chưa được cấu hình");
  const storageRef = ref(storage, `doctors/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
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
  if (!db) return;
  try {
    await deleteDoc(doc(db, "doctors", id));
  } catch (e) {
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
      where("status", "==", "Chờ khám")
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
