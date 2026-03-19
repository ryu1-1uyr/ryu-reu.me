# reu's blog

Next.js + Supabase で作った個人ブログ。

## 技術スタック

- **Next.js 16** (App Router)
- **Prisma** + Supabase (PostgreSQL)
- **Supabase Storage** — 画像アップロード
- **Supabase Auth** — 認証（メール/パスワード）
- **Tailwind CSS**
- **Storybook**

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数

`.env` に以下を設定：

```
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

### 3. DB マイグレーション

```bash
npx prisma migrate dev
```

### 4. 開発サーバー

```bash
npm run dev
```

http://localhost:3000 で開く。

## 主な機能

- **ブログ記事の閲覧** — トップページに記事一覧、クリックで詳細表示
- **記事エディタ** (`/upload`) — Markdown エディタ + リアルタイムプレビュー
- **画像アップロード** — D&D で Supabase Storage にアップ、本文に自動挿入
- **認証** — `/upload` と API は Supabase Auth で保護済み。ログインは `/login` から

## Supabase の設定

- **Storage**: `blog-images` バケットを作成（Public）
- **Auth**: Authentication > Users からユーザーを手動作成
- **RLS**: Storage に INSERT（authenticated）と SELECT（public）ポリシーを設定
