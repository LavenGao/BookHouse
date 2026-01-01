import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

type FirebaseBundle = {
  app: FirebaseApp;
  db: Firestore;
  storage: FirebaseStorage;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

export function initFirebase(): FirebaseBundle | null {
  if (!hasFirebaseConfig) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);
  return { app, db, storage };
}

// Convenience helpers for Firestore interactions.
export const firestoreApi = {
  async addWithTimestamp(db: Firestore, path: string, data: Record<string, unknown>) {
    return addDoc(collection(db, path), { ...data, created_at: serverTimestamp() });
  },
  async updateById(db: Firestore, path: string, id: string, data: Record<string, unknown>) {
    const docRef = doc(db, path, id);
    return updateDoc(docRef, data);
  },
  async listByField(
    db: Firestore,
    path: string,
    field: string,
    value: string,
    orderField = "created_at"
  ) {
    const q = query(collection(db, path), where(field, "==", value), orderBy(orderField, "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
};

export const storageApi = {
  async uploadBlob(storage: FirebaseStorage, file: File, folder = "uploads") {
    const path = `${folder}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }
};
