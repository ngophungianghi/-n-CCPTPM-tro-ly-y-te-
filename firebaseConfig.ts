
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAf-zV7NCVm3wQ1ZZeR8_z0nf1iNYuCd7c",
  authDomain: "healthcareapp-8a21a.firebaseapp.com",
  projectId: "healthcareapp-8a21a",
  storageBucket: "healthcareapp-8a21a.firebasestorage.app",
  messagingSenderId: "240512972044",
  appId: "1:240512972044:web:c6216da2ced27098314529",
  measurementId: "G-GZFWYFESNW"
};

export const isFirebaseConfigured = true;

let db: any = null;
let storage: any = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log("✅ Kết nối Firebase & Storage thành công");
} catch (error) {
  console.error("❌ Lỗi kết nối Firebase:", error);
}

export { db, storage };
