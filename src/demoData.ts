import { Book, Comment, Progress, User, Visit } from "./types";

export const demoUsers: User[] = [
  {
    user_id: "u-ayu",
    nickname: "阿玉",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60",
    intro: "喜欢在午后阳光里翻书。",
    created_at: Date.now() - 1000 * 60 * 60 * 24 * 14
  },
  {
    user_id: "u-mu",
    nickname: "木木",
    avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=60",
    intro: "喜欢在深夜写下读书碎片。",
    created_at: Date.now() - 1000 * 60 * 60 * 24 * 12
  }
];

export const demoBooks: Book[] = [
  {
    book_id: "b-1",
    user_id: "u-ayu",
    title: "岛上书店",
    cover_image_url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=320&q=60",
    total_pages: 320,
    status: "reading",
    created_at: Date.now() - 1000 * 60 * 60 * 24 * 9
  },
  {
    book_id: "b-2",
    user_id: "u-ayu",
    title: "小王子",
    cover_image_url: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&w=320&q=60",
    total_pages: 180,
    status: "reading",
    created_at: Date.now() - 1000 * 60 * 60 * 24 * 5
  },
  {
    book_id: "b-3",
    user_id: "u-mu",
    title: "人类简史",
    cover_image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=320&q=60",
    total_pages: 460,
    status: "reading",
    created_at: Date.now() - 1000 * 60 * 60 * 24 * 11
  }
];

export const demoProgress: Progress[] = [
  {
    progress_id: "p-1",
    book_id: "b-1",
    current_page: 120,
    progress_percent: 37.5,
    text_note: "岛上书店像一个温柔的避风港。",
    image_url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=400&q=60",
    created_at: Date.now() - 1000 * 60 * 60 * 24 * 3
  },
  {
    progress_id: "p-2",
    book_id: "b-1",
    current_page: 178,
    progress_percent: 55.6,
    text_note: "在雨天继续读，感觉书里的人也在陪我。",
    created_at: Date.now() - 1000 * 60 * 60 * 20
  },
  {
    progress_id: "p-3",
    book_id: "b-3",
    current_page: 90,
    progress_percent: 19.6,
    text_note: "人类历史被重新串起来，脑子像在放电影。",
    created_at: Date.now() - 1000 * 60 * 60 * 30
  }
];

export const demoVisits: Visit[] = [
  {
    visit_id: "v-1",
    visitor_user_id: "u-mu",
    owner_user_id: "u-ayu",
    created_at: Date.now() - 1000 * 60 * 60 * 5
  }
];

export const demoComments: Comment[] = [
  {
    comment_id: "c-1",
    progress_id: "p-1",
    user_id: "u-mu",
    content: "看到你坚持读到这里，好厉害！",
    created_at: Date.now() - 1000 * 60 * 60 * 4
  }
];
