import Link from "next/link";
import PostCard from "@/app/components/PostCard";

export type PostItem = {
  id: string;
  title: string;
  slug: string;
  authorEmail: string;
  createdAt: Date;
  updatedAt: Date;
  content: string;
  tags?: string[];
};

type Props = {
  posts: PostItem[];
  showMoreLink?: boolean;
  showHeading?: boolean;
};

export default function PostListView({ posts, showMoreLink = false, showHeading = true }: Props) {
  if (posts.length === 0) {
    return (
      <div className={`${showHeading ? "p-6" : ""} text-center text-illustration-secondary`}>
        投稿がまだありません
      </div>
    );
  }

  return (
    <div className={`${showHeading ? "p-6" : ""} space-y-4`}>
      {showHeading && (
        <h2 className="text-sm font-semibold text-elements-headline tracking-widest border-l-2 border-elements-button pl-2 mb-4">
          最近の戯言
        </h2>
      )}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          id={post.id}
          slug={post.slug}
          title={post.title}
          authorEmail={post.authorEmail}
          createdAt={post.createdAt}
          content={post.content}
          tags={post.tags}
        />
      ))}
      {showMoreLink && (
        <div className="pt-2 text-center">
          <Link
            href="/blog"
            className="text-sm text-elements-button hover:underline"
          >
            もっと見る →
          </Link>
        </div>
      )}
    </div>
  );
}
