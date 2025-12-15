/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Memory, CategoryNode } from "../types";

// Firebase Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// --- Auth Services ---
export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Login failed", error);
    alert("登入失敗，請檢查網路或重試");
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
  // 為了簡化，我們假設 categories 集合儲存的是頂層分類文件，每個文件包含 children 陣列
  // 但為了實作樹狀結構的 CRUD，通常建議將整個樹存為單一文件或是扁平化儲存
  // 這裡為了配合 App.tsx 的邏輯，我們將監聽一個 'settings' 集合中的 'categories' 文件
  // 若該文件不存在，則初始化它
  
  const docRef = doc(db, "settings", "global_categories");
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().data as CategoryNode[]);
    } else {
        // 如果還沒有分類，不做動作，等待初始化
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
    const docRef = doc(db, "settings", "global_categories");
    const snapshot = await getDocs(query(collection(db, "settings")));
    let exists = false;
    snapshot.forEach(d => { if(d.id === 'global_categories') exists = true; });

    if (!exists) {
        await setDoc(docRef, { data: defaultCategories });
    }
}