import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// VITE yêu cầu dùng import.meta.env và tiền tố VITE_ để bảo mật
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Kiểm tra cấu hình
export const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;

let db = null;
let storage = null;

try {
  if (isFirebaseConfigured) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("✅ Kết nối Firebase & Storage thành công");
  } else {
    console.warn("⚠️ Thiếu cấu hình VITE_FIREBASE_API_KEY trên Vercel.");
  }
} catch (error) {
  console.error("❌ Lỗi kết nối Firebase:", error);
}

export { db, storage };
