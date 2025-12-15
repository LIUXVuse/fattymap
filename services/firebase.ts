// @ts-ignore
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, getDocs, where } from "firebase/firestore";
// import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; // 暫時停用 Firebase Storage
import { Memory, CategoryNode, Comment } from "../types";

// Workaround for missing types in current environment
const env = (import.meta as any).env || {};

// Firebase Config
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Cloudinary Config (從環境變數讀取，如果沒有則使用預設值或報錯)
// 請在 Cloudflare 後台設定這兩個變數
const CLOUDINARY_CLOUD_NAME = env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!firebaseConfig.apiKey) {
  console.error("🔥 Firebase API Key 尚未設定！請檢查 Cloudflare 環境變數或 .env 檔案。");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const storage = getStorage(app); // 暫時停用
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

// --- Image Upload Service (Switched to Cloudinary) ---
/**
 * 上傳圖片到 Cloudinary (取代 Firebase Storage)
 * 使用 Unsigned Upload 模式，無需後端簽章
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
  // 檢查設定
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.error("Cloudinary 設定缺失", { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET });
      alert("系統錯誤：圖片上傳服務尚未設定 (Cloudinary)。請聯繫管理員。");
      throw new Error("Cloudinary config missing");
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  
  // Cloudinary 支援 folder 參數，我們可以利用 path 來模擬資料夾結構
  // path 範例: memories/uid/filename.jpg -> 取 memories/uid
  const folder = path.substring(0, path.lastIndexOf('/'));
  if (folder) {
      formData.append("folder", folder);
  }

  try {
      const response = await fetch(url, {
          method: "POST",
          body: formData
      });

      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || "Upload failed");
      }

      const data = await response.json();
      // 回傳 secure_url (HTTPS)
      return data.secure_url;

  } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw error;
  }
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
};

// --- Firestore Services (Comments) ---
export const subscribeToComments = (memoryId: string, callback: (comments: Comment[]) => void) => {
    // 使用 sub-collection "comments"
    const q = query(collection(db, "memories", memoryId, "comments"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Comment));
        callback(comments);
    }, (error) => {
        console.error("Comments subscription error:", error);
    });
};

export const addCommentToFirestore = async (memoryId: string, comment: Omit<Comment, "id">) => {
    await addDoc(collection(db, "memories", memoryId, "comments"), comment);
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