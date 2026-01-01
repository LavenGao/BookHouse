# BookHouse · 读书小屋 MVP

一个温柔的两人阅读空间原型：支持虚拟书架、阅读进度时间轴、串门留痕与留言。默认使用本地演示数据，可配置 Firebase Firestore/Storage 做持久化。

## 技术栈
- React + TypeScript + Vite
- Firebase Firestore（数据）/ Storage（图片、语音占位文件）
- 纯 CSS，无 UI 组件库，方便按需调整

## 主要功能
- 「我的小屋 / 好友小屋」切换，显示小屋名称与简介
- 虚拟书架：多本书并行，封面卡片、最新进度、最近更新时间
- 添加新书：上传封面（可替换为 OCR 识别），填写书名与总页数
- 阅读进度更新：输入当前页数，计算进度百分比，附加文字/照片/语音占位，生成时间轴
- 留言互动：为某条进度记录留言鼓励
- 串门访问：访问好友小屋产生「坐坐」记录，展示最近来访
- 年度 12 本进度条、平均进度等简易统计

## 开发与运行
```bash
npm install
npm run dev   # 默认 http://localhost:5173
npm run build # 产出 dist/
```

## Firebase 配置
1. 复制 `.env.example` 为 `.env`，填入 Firebase Web App 配置。
2. Firestore 建议开启集合：`users` / `books` / `progress` / `visits` / `comments`（代码里已准备 add 写入，读取可按需扩展）。
3. Storage 默认上传目录 `uploads/`。
4. 未配置 `.env` 时自动进入 Demo 本地模式，所有数据存在内存里（刷新即重置）。

## 数据模型（与需求对齐）
- `User { user_id, nickname, avatar, intro, created_at }`
- `Book { book_id, user_id, title, cover_image_url, total_pages, status, created_at }`
- `Progress { progress_id, book_id, current_page, progress_percent, text_note?, image_url?, audio_url?, created_at }`
- `Visit { visit_id, visitor_user_id, owner_user_id, created_at }`
- `Comment { comment_id, progress_id, user_id, content, created_at }`

## Demo 交互流程
1. 选择「我是谁」和「好友」，点击「去好友小屋串门」会留下来访记录。
2. 在「新增书籍」填写书名/总页数并上传封面，书架立刻出现卡片。
3. 点开书卡，填写当前页、感想、照片（可选），提交后时间轴出现新记录与进度百分比。
4. 在右侧留言卡片选择一条动态，写下鼓励语；好友可在自己的账号下回复。
5. 左侧概览卡会展示年度 12 本进度、平均进度、好友动态提醒等。

## GitHub 仓库创建与提交流程
1. 在 GitHub 新建仓库（例如 `bookhouse`），选择空仓库。
2. 本地执行：
   ```bash
   git init
   git branch -M main
   git remote add origin https://github.com/<your-username>/bookhouse.git
   git add .
   git commit -m "feat: init bookhouse mvp"
   git push -u origin main
   ```
3. 需要在线预览时，可开启 GitHub Pages：
   - 在 `vite.config.ts` 设置 `base: "/bookhouse/"`（或你的仓库名）。
   - Settings → Pages → Source 选 `GitHub Actions`，使用 Vite 的静态站点预设工作流。

## 后续可迭代
- 接入 Firebase Auth（邮箱/短信）并做互为好友校验
- Firestore 读操作 + 实时监听（`onSnapshot`）同步进度和留言
- OCR / ASR 接口替换封面与语音占位
- 手机端上传拍照优化、离线草稿缓存
- 更细腻的提醒中心与批量通知偏好配置
