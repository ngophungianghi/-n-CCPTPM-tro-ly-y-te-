import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// FIX: Sử dụng optional chaining (?.) để tránh lỗi "Cannot read properties of undefined"
// Nếu import.meta.env không tồn tại (do lỗi build), nó sẽ trả về undefined thay vì crash app.

export const firebaseConfig = {
  // @ts-ignore
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
  // @ts-ignore
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
  // @ts-ignore
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
  // @ts-ignore
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
  // @ts-ignore
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // @ts-ignore
  appId: import.meta.env?.VITE_FIREBASE_APP_ID,
  // @ts-ignore
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID
};

// @ts-ignore
// Kiểm tra an toàn hơn
export const isFirebaseConfigured = !!(import.meta.env?.VITE_FIREBASE_API_KEY);

let db: any = null;
let storage: any = null;

try {
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