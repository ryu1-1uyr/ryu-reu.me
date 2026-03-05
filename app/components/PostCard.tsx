import Link from "next/link";

type Props = {
  title: string;
  slug: string;
  authorEmail: string;
  createdAt: Date;
  content: string;
};

export default function PostCard({
  title,
  slug,
  authorEmail,
  createdAt,
  content,
}: Props) {
  return (
    <article className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/posts/${slug}`}>
        <h3 className="text-xl font-semibold hover:underline">{title}</h3>
      </Link>
      <p className="text-sm text-gray-500 mt-1">
        by {authorEmail} · {new Date(createdAt).toLocaleDateString("ja-JP")}
      </p>
      <p className="mt-2 text-gray-700 line-clamp-3">{content}</p>
    </article>
  );
}
