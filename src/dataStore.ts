import { demoBooks, demoComments, demoProgress, demoUsers, demoVisits } from "./demoData";
import { hasFirebaseConfig, initFirebase, firestoreApi, storageApi } from "./firebase";
import { Book, Comment, Progress, User, Visit } from "./types";

export type CabinState = {
  users: User[];
  books: Book[];
  progress: Progress[];
  visits: Visit[];
  comments: Comment[];
};

const firebaseBundle = initFirebase();

export const buildInitialState = (): CabinState => ({
  users: demoUsers,
  books: demoBooks,
  progress: demoProgress,
  visits: demoVisits,
  comments: demoComments
});

export const generateId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export const calculatePercent = (currentPage: number, totalPages: number) =>
  Math.min(100, Math.round((currentPage / totalPages) * 1000) / 10);

export const uploadMedia = async (file?: File) => {
  if (!file) return "";
  if (firebaseBundle) {
    try {
      const url = await storageApi.uploadBlob(firebaseBundle.storage, file);
      return url;
    } catch (err) {
      console.warn("Upload failed, falling back to local preview", err);
    }
  }
  return URL.createObjectURL(file);
};

export const persistBook = async (book: Book) => {
  if (!firebaseBundle) return;
  await firestoreApi.addWithTimestamp(firebaseBundle.db, "books", book);
};

export const persistProgress = async (progress: Progress) => {
  if (!firebaseBundle) return;
  await firestoreApi.addWithTimestamp(firebaseBundle.db, "progress", progress);
};

export const persistVisit = async (visit: Visit) => {
  if (!firebaseBundle) return;
  await firestoreApi.addWithTimestamp(firebaseBundle.db, "visits", visit);
};

export const persistComment = async (comment: Comment) => {
  if (!firebaseBundle) return;
  await firestoreApi.addWithTimestamp(firebaseBundle.db, "comments", comment);
};

export const annualGoalPercent = (books: Book[]) => {
  const finished = books.filter((b) => b.status === "finished").length;
  return Math.min(100, Math.round((finished / 12) * 100));
};

export const latestProgressForBook = (bookId: string, progress: Progress[]) =>
  progress
    .filter((p) => p.book_id === bookId)
    .sort((a, b) => b.created_at - a.created_at)[0];

export const isDemoMode = () => !hasFirebaseConfig;
