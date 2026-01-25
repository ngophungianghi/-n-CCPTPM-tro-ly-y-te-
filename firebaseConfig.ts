import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Sử dụng biến môi trường từ process.env
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Kiểm tra xem key có tồn tại không
export const isFirebaseConfigured = !!process.env.VITE_FIREBASE_API_KEY;

let db: any = null;
let storage: any = null;

try {
  // Kiểm tra xem config có giá trị không trước khi init
  if (isFirebaseConfigured) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("✅ Kết nối Firebase & Storage thành công");
  } else {
    console.warn("⚠️ Chưa cấu hình Firebase Key (VITE_FIREBASE_...) trong .env hoặc Vercel Settings.");
  }
} catch (error) {
  console.error("❌ Lỗi kết nối Firebase:", error);
}

export { db, storage };
