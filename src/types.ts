export type User = {
  user_id: string;
  nickname: string;
  avatar?: string;
  intro?: string;
  created_at: number;
};

export type Book = {
  book_id: string;
  user_id: string;
  title: string;
  cover_image_url?: string;
  total_pages: number;
  status: "reading" | "finished";
  created_at: number;
};

export type Progress = {
  progress_id: string;
  book_id: string;
  current_page: number;
  progress_percent: number;
  text_note?: string;
  image_url?: string;
  audio_url?: string;
  created_at: number;
};

export type Visit = {
  visit_id: string;
  visitor_user_id: string;
  owner_user_id: string;
  created_at: number;
};

export type Comment = {
  comment_id: string;
  progress_id: string;
  user_id: string;
  content: string;
  created_at: number;
};
