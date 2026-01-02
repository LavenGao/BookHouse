import { demoBooks, demoComments, demoProgress, demoUsers, demoVisits } from "./demoData";
import { hasFirebaseConfig, firebaseBundle, firestoreApi, storageApi } from "./firebase";
import { Book, Comment, Progress, User, Visit } from "./types";

export type CabinState = {
  users: User[];
  books: Book[];
  progress: Progress[];
  visits: Visit[];
  comments: Comment[];
};

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

const toMillis = (value: unknown) => {
  if (!value) return Date.now();
  // Firestore Timestamp has toMillis, Date has getTime.
  if (typeof value === "object" && value !== null && "toMillis" in value && typeof (value as any).toMillis === "function") {
    return (value as any).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return Date.now();
};

export const loadRemoteState = async (): Promise<CabinState | null> => {
  if (!firebaseBundle) return null;
  const { db } = firebaseBundle;
  try {
    const [usersRaw, booksRaw, progressRaw, visitsRaw, commentsRaw] = await Promise.all([
      firestoreApi.listAll(db, "users"),
      firestoreApi.listAll(db, "books"),
      firestoreApi.listAll(db, "progress"),
      firestoreApi.listAll(db, "visits"),
      firestoreApi.listAll(db, "comments")
    ]);
    const users: User[] = usersRaw.map((u: any) => ({
      user_id: u.user_id ?? u.id,
      nickname: u.nickname ?? "好友",
      avatar: u.avatar,
      intro: u.intro,
      created_at: toMillis(u.created_at)
    }));
    const books: Book[] = booksRaw.map((b: any) => ({
      book_id: b.book_id ?? b.id,
      user_id: b.user_id,
      title: b.title,
      cover_image_url: b.cover_image_url,
      total_pages: b.total_pages,
      status: b.status ?? "reading",
      created_at: toMillis(b.created_at)
    }));
    const progress: Progress[] = progressRaw.map((p: any) => ({
      progress_id: p.progress_id ?? p.id,
      book_id: p.book_id,
      current_page: p.current_page,
      progress_percent: p.progress_percent,
      text_note: p.text_note,
      image_url: p.image_url,
      audio_url: p.audio_url,
      created_at: toMillis(p.created_at)
    }));
    const visits: Visit[] = visitsRaw.map((v: any) => ({
      visit_id: v.visit_id ?? v.id,
      visitor_user_id: v.visitor_user_id,
      owner_user_id: v.owner_user_id,
      created_at: toMillis(v.created_at)
    }));
    const comments: Comment[] = commentsRaw.map((c: any) => ({
      comment_id: c.comment_id ?? c.id,
      progress_id: c.progress_id,
      user_id: c.user_id,
      content: c.content,
      created_at: toMillis(c.created_at)
    }));
    return { users, books, progress, visits, comments };
  } catch (err) {
    console.warn("Failed to load Firestore data, fallback to demo", err);
    return null;
  }
};

export const persistUser = async (user: User) => {
  if (!firebaseBundle) return;
  await firestoreApi.addWithTimestamp(firebaseBundle.db, "users", user);
};
