/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Memory, CategoryNode } from "../types";

// Firebase Config
// 使用環境變數 (Environment Variables) 確保敏感資訊不直接進入 Git
// 請在 Cloudflare Pages 後台 > Settings > Environment variables 設定這些值
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 簡單檢查變數是否載入成功 (開發時除錯用)
if (!firebaseConfig.apiKey) {
  console.error("🔥 Firebase API Key 尚未設定！請檢查 Cloudflare 環境變數或 .env 檔案。");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// --- Auth Services ---
export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("Login failed", error);
    if (error.code === 'auth/unauthorized-domain') {
        alert("登入失敗：網域未授權。\n請到 Firebase Console > Authentication > Settings > Authorized domains\n新增您的 Cloudflare 網址。");
    } else {
        alert(`登入失敗 (${error.code})，請檢查網路或 API Key 設定`);
    }
  }
};

export const logout = async () => {
  await firebaseSignOut(auth);
};

// --- Storage Services ---
export const uploadImage = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// --- Firestore Services (Memories) ---
// 即時監聽 Memories
export const subscribeToMemories = (callback: (memories: Memory[]) => void) => {
  const q = query(collection(db, "memories"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const memories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Memory));
    callback(memories);
  }, (error) => {
      console.error("Firestore subscription error:", error);
      // 如果遇到權限錯誤，通常是因為 Firestore Rules 沒設好，或是 API Key 錯誤
  });
};

export const addMemoryToFireStore = async (memory: Omit<Memory, "id">) => {
  await addDoc(collection(db, "memories"), memory);
};

export const updateMemoryInFirestore = async (id: string, data: Partial<Memory>) => {
  const docRef = doc(db, "memories", id);
  await updateDoc(docRef, data);
};

export const deleteMemoryFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, "memories", id));
  // Note: 實際專案中，這裡也應該刪除 Storage 中對應的照片，以節省空間
};

// --- Firestore Services (Categories) ---
export const subscribeToCategories = (callback: (categories: CategoryNode[]) => void) => {
  const docRef = doc(db, "settings", "global_categories");
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().data as CategoryNode[]);
    } else {
        callback([]);
    }
  });
};

export const saveCategoriesToFirestore = async (categories: CategoryNode[]) => {
  const docRef = doc(db, "settings", "global_categories");
  await setDoc(docRef, { data: categories }, { merge: true });
};

// 初始化預設分類 (只執行一次)
export const initCategoriesIfEmpty = async (defaultCategories: CategoryNode[]) => {
    try {
        const docRef = doc(db, "settings", "global_categories");
        const docSnap = await import("firebase/firestore").then(m => m.getDoc(docRef));
        
        if (!docSnap.exists()) {
            await setDoc(docRef, { data: defaultCategories });
        }
    } catch (e) {
        console.error("Init categories error:", e);
    }
}