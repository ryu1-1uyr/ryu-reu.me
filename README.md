# reu's blog

レトロデスクトップ風 UI の個人ブログ兼実験場。天気連動の空アニメーション、お絵描き機能、物理演算キャンバスなど遊び要素多め。

## 主な機能

### ブログ

- 動的 OG 画像生成
- 画像の D&D アップロード（Supabase Storage）
- タグシステム（記事のタグ付け・フィルタリング）
- ページネーション、ISR キャッシュ（1 時間）
- Markdown エディタ + リアルタイムプレビュー（同期スクロール付き）

### デスクトップ UI

- レトロ OS 風ウィンドウ・タスクバー
- ドラッグ可能なウィンドウ管理

### 天気連動アニメーション

- リアルタイム天気 API 連携
- 時間帯に応じた空の色変化（朝焼け・昼・夕焼け・夜）
- 天気に応じた雲・雨・雪・雷エフェクト（Canvas）
- デルタタイム補正によるリフレッシュレート非依存アニメーション

### お絵描き & 物理演算

- Canvas お絵描き → 空に飛ばしてドリフト表示
- Matter.js による物理演算キャンバス <- 試してるだけで見える場所にはまだ使っていない。

## 技術スタック

| レイヤー           | 技術                                              |
| ------------------ | ------------------------------------------------- |
| フレームワーク     | Next.js 16 (App Router) / React 18 / TypeScript 5 |
| スタイリング       | Tailwind CSS 3                                    |
| データベース       | PostgreSQL (Supabase) + Prisma ORM                |
| 認証               | Supabase Auth                                     |
| ファイルストレージ | Supabase Storage                                  |
| アニメーション     | Framer Motion / Canvas API                        |
| 物理演算           | Matter.js                                         |
| コンポーネント管理 | Storybook 10                                      |
| テスト             | Vitest / Playwright                               |
| 分析               | Vercel Analytics & Speed Insights                 |
| デプロイ           | Vercel                                            |

## セットアップ

### 1. 依存パッケージ

```bash
npm install
```

### 2. 環境変数

`.env` に以下を設定:

```
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
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

### 5. Storybook

```bash
npm run storybook
```

http://localhost:6006 で開く。

## Supabase の設定

- **Storage**: `blog-images` バケットを作成（Public）
- **Auth**: Authentication > Users からユーザーを手動作成
- **RLS**: Storage に INSERT（authenticated）と SELECT（public）ポリシーを設定

## プロジェクト構成

```
app/
├── _sections/          # ページセクション（Desktop, AboutMe, DrawingCanvas, WeatherControl）
├── components/         # 共通コンポーネント（Card, RetroWindow, SkyBackground, TagInput 等）
├── hooks/              # カスタムフック（useSkyPhase, useClickOutside, useWeatherData 等）
├── contexts/           # Context（WindowManager, SkyDrawings, WeatherOverride, PostsCache）
├── api/                # API Routes（posts, tags, upload, weather, og）
├── blog/               # ブログ一覧・詳細ページ
├── upload/             # 記事エディタ（認証必須）
└── login/              # ログインページ
prisma/
└── schema.prisma       # DB スキーマ（User, Post, Tag, PostTag, Image）
```
