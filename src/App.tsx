import { useEffect, useMemo, useState, type ReactNode } from "react";
import "./App.css";
import {
  annualGoalPercent,
  buildInitialState,
  calculatePercent,
  generateId,
  isDemoMode,
  latestProgressForBook,
  persistBook,
  persistComment,
  persistProgress,
  persistVisit,
  uploadMedia
} from "./dataStore";
import { Book, Comment, Progress, Visit } from "./types";

type BookFormState = {
  title: string;
  totalPages: string;
  coverFile: File | null;
};

type ProgressFormState = {
  page: string;
  note: string;
  imageFile: File | null;
  audioFile: File | null;
};

type CommentFormState = {
  progressId: string;
  content: string;
};

const visitMessages = ["我来你的阅读小屋坐坐 ☕", "看到你又继续向前一步啦 ✨", "给你留下一点温柔的风。"];

function App() {
  const [state, setState] = useState(buildInitialState());
  const [currentUserId, setCurrentUserId] = useState(state.users[0]?.user_id ?? "");
  const [friendUserId, setFriendUserId] = useState(state.users[1]?.user_id ?? "");
  const [viewOwnerId, setViewOwnerId] = useState(state.users[0]?.user_id ?? "");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState<BookFormState>({ title: "", totalPages: "", coverFile: null });
  const [progressForm, setProgressForm] = useState<ProgressFormState>({
    page: "",
    note: "",
    imageFile: null,
    audioFile: null
  });
  const [commentForm, setCommentForm] = useState<CommentFormState>({ progressId: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const demo = isDemoMode();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    // Default view to the signed-in user.
    setViewOwnerId(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    // Auto-select the latest book for the viewed cabin.
    const first = state.books.find((b) => b.user_id === viewOwnerId);
    setSelectedBookId(first?.book_id ?? null);
  }, [viewOwnerId, state.books]);

  const currentUser = state.users.find((u) => u.user_id === currentUserId);
  const friendUser = state.users.find((u) => u.user_id === friendUserId);
  const owner = state.users.find((u) => u.user_id === viewOwnerId);
  const ownerBooks = state.books.filter((b) => b.user_id === viewOwnerId);
  const selectedBook = ownerBooks.find((b) => b.book_id === selectedBookId) ?? ownerBooks[0] ?? null;

  const timeline = useMemo(() => {
    if (!selectedBook) return [];
    return state.progress
      .filter((p) => p.book_id === selectedBook.book_id)
      .sort((a, b) => b.created_at - a.created_at);
  }, [selectedBook, state.progress]);

  useEffect(() => {
    if (!commentForm.progressId && timeline[0]) {
      setCommentForm((prev) => ({ ...prev, progressId: timeline[0].progress_id }));
    }
  }, [timeline, commentForm.progressId]);

  const latestForBook = (bookId: string) => latestProgressForBook(bookId, state.progress);

  const ownerProgressAverage = useMemo(() => {
    if (!ownerBooks.length) return 0;
    const percents = ownerBooks.map((b) => latestForBook(b.book_id)?.progress_percent ?? 0);
    const total = percents.reduce((sum, p) => sum + p, 0);
    return Math.round(total / ownerBooks.length);
  }, [ownerBooks, state.progress]);

  const reminders = useMemo(() => {
    const friendBooks = friendUser ? state.books.filter((b) => b.user_id === friendUser.user_id) : [];
    const friendName = friendUser?.nickname ?? "好友";
    const friendProgress = state.progress.filter((p) => friendBooks.some((b) => b.book_id === p.book_id));
    const events = [
      ...friendBooks.map((b) => ({ type: "book", text: `${friendName} 上架了《${b.title}》`, at: b.created_at })),
      ...friendProgress.map((p) => {
        const book = friendBooks.find((b) => b.book_id === p.book_id);
        return {
          type: "progress",
          text: `${friendName} 读到第 ${p.current_page} 页《${book?.title ?? ""}》`,
          at: p.created_at
        };
      }),
      ...state.visits
        .filter((v) => v.owner_user_id === currentUserId)
        .map((v) => ({
          type: "visit",
          text: `${state.users.find((u) => u.user_id === v.visitor_user_id)?.nickname ?? "好友"} 来过你的阅读小屋`,
          at: v.created_at
        }))
    ];
    return events.sort((a, b) => b.at - a.at).slice(0, 4);
  }, [friendUser, state.books, state.progress, state.visits, currentUserId]);

  const handleAddBook = async () => {
    if (!bookForm.title || !bookForm.totalPages) {
      setNotice("请填写书名和总页数");
      return;
    }
    setSaving(true);
    try {
      const coverUrl = await uploadMedia(bookForm.coverFile ?? undefined);
      const totalPages = Number(bookForm.totalPages);
      const newBook: Book = {
        book_id: generateId("b"),
        user_id: currentUserId,
        title: bookForm.title.trim(),
        cover_image_url: coverUrl,
        total_pages: totalPages,
        status: "reading",
        created_at: Date.now()
      };
      setState((prev) => ({ ...prev, books: [newBook, ...prev.books] }));
      setViewOwnerId(currentUserId);
      setSelectedBookId(newBook.book_id);
      setBookForm({ title: "", totalPages: "", coverFile: null });
      setNotice("新书已加入书架");
      await persistBook(newBook);
    } finally {
      setSaving(false);
    }
  };

  const handleAddProgress = async () => {
    if (!selectedBook) {
      setNotice("请先选择一本书");
      return;
    }
    if (selectedBook.user_id !== currentUserId) {
      setNotice("只能给自己的书更新进度");
      return;
    }
    if (!progressForm.page) {
      setNotice("请输入当前页数");
      return;
    }
    setSaving(true);
    try {
      const imageUrl = await uploadMedia(progressForm.imageFile ?? undefined);
      const audioUrl = await uploadMedia(progressForm.audioFile ?? undefined);
      const currentPage = Number(progressForm.page);
      const percent = calculatePercent(currentPage, selectedBook.total_pages);
      const progress: Progress = {
        progress_id: generateId("p"),
        book_id: selectedBook.book_id,
        current_page: currentPage,
        progress_percent: percent,
        text_note: progressForm.note.trim() || undefined,
        image_url: imageUrl || undefined,
        audio_url: audioUrl || undefined,
        created_at: Date.now()
      };
      setState((prev) => ({ ...prev, progress: [progress, ...prev.progress] }));
      setProgressForm({ page: "", note: "", imageFile: null, audioFile: null });
      setNotice("进度已更新");
      await persistProgress(progress);
    } finally {
      setSaving(false);
    }
  };

  const handleVisitCabin = async () => {
    if (!friendUser) return;
    setViewOwnerId(friendUser.user_id);
    const visit: Visit = {
      visit_id: generateId("v"),
      visitor_user_id: currentUserId,
      owner_user_id: friendUser.user_id,
      created_at: Date.now()
    };
    setState((prev) => ({ ...prev, visits: [visit, ...prev.visits] }));
    setNotice(visitMessages[Math.floor(Math.random() * visitMessages.length)]);
    await persistVisit(visit);
  };

  const handleAddComment = async () => {
    if (!commentForm.progressId || !commentForm.content) {
      setNotice("请选择动态并填写留言");
      return;
    }
    const comment: Comment = {
      comment_id: generateId("c"),
      progress_id: commentForm.progressId,
      user_id: currentUserId,
      content: commentForm.content.trim(),
      created_at: Date.now()
    };
    setState((prev) => ({ ...prev, comments: [comment, ...prev.comments] }));
    setCommentForm((prev) => ({ ...prev, content: "" }));
    setNotice("留言已发送");
    await persistComment(comment);
  };

  const commentsForProgress = (progressId: string) =>
    state.comments.filter((c) => c.progress_id === progressId).sort((a, b) => b.created_at - a.created_at);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="brand">BookHouse · 读书小屋</div>
          <p className="muted">柔软的两人阅读角落 · 支持虚拟书架、进度更新、串门互动</p>
        </div>
        {demo && <div className="demo-pill">Demo 本地数据 · 配置 Firebase 后可持久化</div>}
      </header>

      <section className="card">
        <div className="row between">
          <div className="row gap">
            <div>
              <label>我是谁</label>
              <select value={currentUserId} onChange={(e) => setCurrentUserId(e.target.value)}>
                {state.users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.nickname}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>好友</label>
              <select value={friendUserId} onChange={(e) => setFriendUserId(e.target.value)}>
                {state.users
                  .filter((u) => u.user_id !== currentUserId)
                  .map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.nickname}
                    </option>
                  ))}
              </select>
              <p className="muted tiny">只展示互为好友的小屋（后续可接入校验）</p>
            </div>
          </div>
          <div className="pill-tabs">
            <button className={viewOwnerId === currentUserId ? "active" : ""} onClick={() => setViewOwnerId(currentUserId)}>
              回到我的小屋
            </button>
            <button
              className={viewOwnerId === friendUserId ? "active" : ""}
              onClick={handleVisitCabin}
              disabled={!friendUser}
            >
              去好友小屋串门
            </button>
          </div>
        </div>

        <div className="row gap owner">
          <div className="avatar-circle">{owner?.nickname?.slice(0, 1)}</div>
          <div>
            <h2>{owner ? `${owner.nickname} 的小屋` : "小屋"}</h2>
            <p className="muted">{owner?.intro ?? "写下你的阅读宣言吧。"}</p>
            <div className="chip">
              <span className="dot online" />
              {ownerBooks.length ? `${ownerBooks.length} 本在读` : "虚拟书架待填满"}
            </div>
          </div>
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <div className="row between">
            <h3>阅读概览</h3>
            <div className="chip muted">
              <span className="dot" /> {new Date().toLocaleDateString()}
            </div>
          </div>
          <div className="stats-grid">
            <StatBlock label="年度 12 本进度" value={`${annualGoalPercent(ownerBooks)}%`}>
              <ProgressBar percent={annualGoalPercent(ownerBooks)} />
            </StatBlock>
            <StatBlock label="平均进度" value={`${ownerProgressAverage}%`}>
              <p className="muted tiny">以每本书最新进度计算</p>
            </StatBlock>
            <StatBlock label="最近来访" value={`${state.visits.filter((v) => v.owner_user_id === viewOwnerId).length} 次`}>
              <p className="muted tiny">访问小屋会留下「坐坐」记录</p>
            </StatBlock>
          </div>
          <div className="notice">
            <div className="tag">温柔提醒</div>
            <div className="reminders">
              {reminders.length === 0 && <p className="muted">好友还没有新动态</p>}
              {reminders.map((r) => (
                <div key={r.text + r.at} className="reminder-row">
                  <span className="dot tiny-dot" />
                  <span>{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <h3>新增书籍（拍封面 / 上传封面）</h3>
          <div className="form-grid">
            <div>
              <label>书名</label>
              <input
                placeholder="书名（可先由 OCR 识别，当前用手填）"
                value={bookForm.title}
                onChange={(e) => setBookForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <label>总页数</label>
              <input
                type="number"
                min={1}
                value={bookForm.totalPages}
                onChange={(e) => setBookForm((p) => ({ ...p, totalPages: e.target.value }))}
              />
            </div>
            <div>
              <label>封面图片</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBookForm((p) => ({ ...p, coverFile: e.target.files?.[0] ?? null }))}
              />
            </div>
          </div>
          <div className="row between">
            <div className="muted tiny">后续可接 OCR 接口自动提取书名</div>
            <button onClick={handleAddBook} disabled={saving}>
              加入虚拟书架
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="row between">
          <h3>虚拟书架</h3>
          <p className="muted tiny">点击封面切换查看书籍详情</p>
        </div>
        {ownerBooks.length === 0 && <p className="muted">书架还空着，添加一本吧。</p>}
        <div className="grid books">
          {ownerBooks.map((book) => {
            const latest = latestForBook(book.book_id);
            const coverStyle = book.cover_image_url ? { backgroundImage: `url(${book.cover_image_url})` } : undefined;
            return (
              <div
                key={book.book_id}
                className={`book-card ${selectedBookId === book.book_id ? "active" : ""}`}
                onClick={() => setSelectedBookId(book.book_id)}
              >
                <div className="cover" style={coverStyle} />
                <h4>{book.title}</h4>
                <ProgressBar percent={latest?.progress_percent ?? 0} />
                <div className="muted tiny">
                  {latest ? `最近更新：第 ${latest.current_page} 页 · ${latest.progress_percent}%` : "暂无进度"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {selectedBook && (
        <section className="card detail">
          <div className="row between">
            <div>
              <h3>书籍详情 · 《{selectedBook.title}》</h3>
              <p className="muted tiny">
                总页数 {selectedBook.total_pages} 页 · 当前进度{" "}
                {latestForBook(selectedBook.book_id)?.progress_percent ?? 0}%{" "}
              </p>
            </div>
            {selectedBook.user_id === currentUserId && (
              <div className="tag">我在更新</div>
            )}
          </div>

          <div className="grid two">
            <div className="card surface">
              <h4>更新阅读进度</h4>
              <div className="form-grid">
                <div>
                  <label>当前页数</label>
                  <input
                    type="number"
                    min={1}
                    value={progressForm.page}
                    onChange={(e) => setProgressForm((p) => ({ ...p, page: e.target.value }))}
                  />
                </div>
                <div>
                  <label>读书感想</label>
                  <textarea
                    rows={3}
                    placeholder="今天的阅读心情、想法、金句..."
                    value={progressForm.note}
                    onChange={(e) => setProgressForm((p) => ({ ...p, note: e.target.value }))}
                  />
                </div>
                <div>
                  <label>上传照片</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProgressForm((p) => ({ ...p, imageFile: e.target.files?.[0] ?? null }))}
                  />
                </div>
                <div>
                  <label>上传语音（占位）</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setProgressForm((p) => ({ ...p, audioFile: e.target.files?.[0] ?? null }))}
                  />
                </div>
              </div>
              <div className="row between">
                <div className="muted tiny">自动计算进度百分比 & 记录时间轴</div>
                <button onClick={handleAddProgress} disabled={saving}>
                  提交进度
                </button>
              </div>
            </div>
            <div className="card surface">
              <h4>留言 / 鼓励</h4>
              <div className="form-grid">
                <div>
                  <label>选择一条动态</label>
                  <select
                    value={commentForm.progressId}
                    onChange={(e) => setCommentForm((p) => ({ ...p, progressId: e.target.value }))}
                  >
                    {timeline.map((t) => (
                      <option key={t.progress_id} value={t.progress_id}>
                        {`第 ${t.current_page} 页 · ${new Date(t.created_at).toLocaleString()}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>留言内容</label>
                  <textarea
                    rows={3}
                    placeholder="留下鼓励、想法或小纸条"
                    value={commentForm.content}
                    onChange={(e) => setCommentForm((p) => ({ ...p, content: e.target.value }))}
                  />
                </div>
              </div>
              <div className="row between">
                <div className="muted tiny">支持双方在动态下互相留言</div>
                <button onClick={handleAddComment}>发送留言</button>
              </div>
            </div>
          </div>

          <div className="timeline">
            <h4>阅读时间轴</h4>
            {timeline.length === 0 && <p className="muted">还没有记录，开始写下第一条吧。</p>}
            {timeline.map((item) => (
              <div key={item.progress_id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="row between">
                    <div>
                      <strong>第 {item.current_page} 页</strong>{" "}
                      <span className="muted tiny"> {item.progress_percent}% · {new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <div className="tag">成长记录</div>
                  </div>
                  {item.text_note && <p>{item.text_note}</p>}
                  {(item.image_url || item.audio_url) && (
                    <div className="row gap tiny muted">
                      {item.image_url && <span>📷 照片已留存</span>}
                      {item.audio_url && <span>🎧 语音占位</span>}
                    </div>
                  )}
                  <div className="comments">
                    {commentsForProgress(item.progress_id).map((c) => (
                      <div key={c.comment_id} className="comment">
                        <span className="chip">
                          {state.users.find((u) => u.user_id === c.user_id)?.nickname ?? "好友"}
                        </span>
                        <span>{c.content}</span>
                      </div>
                    ))}
                    {commentsForProgress(item.progress_id).length === 0 && (
                      <div className="muted tiny">还没有留言，去留一句鼓励吧。</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="row between">
          <h3>串门 & 留痕迹</h3>
          <p className="muted tiny">访问好友小屋后会留下「坐坐」记录</p>
        </div>
        <div className="visit-log">
          {state.visits
            .filter((v) => v.owner_user_id === viewOwnerId)
            .sort((a, b) => b.created_at - a.created_at)
            .map((v) => (
              <div key={v.visit_id} className="visit-row">
                <div className="avatar-circle small">
                  {state.users.find((u) => u.user_id === v.visitor_user_id)?.nickname.slice(0, 1)}
                </div>
                <div>
                  <div className="muted tiny">{new Date(v.created_at).toLocaleString()}</div>
                  <div>
                    {state.users.find((u) => u.user_id === v.visitor_user_id)?.nickname} 来坐过一会 ✨
                  </div>
                </div>
              </div>
            ))}
          {state.visits.filter((v) => v.owner_user_id === viewOwnerId).length === 0 && (
            <p className="muted">还没有来访记录</p>
          )}
        </div>
      </section>

      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

type StatProps = {
  label: string;
  value: string;
  children?: ReactNode;
};

function StatBlock({ label, value, children }: StatProps) {
  return (
    <div className="stat-block">
      <div className="muted tiny">{label}</div>
      <div className="stat-value">{value}</div>
      {children}
    </div>
  );
}

const ProgressBar = ({ percent }: { percent: number }) => (
  <div className="progress-bar">
    <div className="progress-inner" style={{ width: `${percent}%` }} />
  </div>
);

export default App;
