import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Sử dụng biến môi trường được define trong vite.config.ts
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigured = !!process.env.FIREBASE_API_KEY;

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
    console.warn("⚠️ Chưa cấu hình Firebase Key trong .env hoặc Vercel Settings.");
  }
} catch (error) {
  console.error("❌ Lỗi kết nối Firebase:", error);
}

export { db, storage };