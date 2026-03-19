import PostCard from "@/app/components/PostCard";

export type PostItem = {
  id: string;
  title: string;
  slug: string; // markdown 中の画像パスで使用予定
  authorEmail: string;
  createdAt: Date;
  updatedAt: Date;
  content: string;
};

type Props = {
  posts: PostItem[];
};

export default function PostListView({ posts }: Props) {
  if (posts.length === 0) {
    return (
      // 投稿がないことはないけど
      <div className="p-6 text-center text-illustration-secondary">
        投稿がまだありません
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-sm font-semibold text-elements-headline tracking-widest border-l-2 border-elements-button pl-2 mb-4">
        投稿一覧
      </h2>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          id={post.id}
          slug={post.slug}
          title={post.title}
          authorEmail={post.authorEmail}
          createdAt={post.createdAt}
          content={post.content}
        />
      ))}
    </div>
  );
}
