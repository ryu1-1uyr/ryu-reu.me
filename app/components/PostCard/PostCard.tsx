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
    <article className="border border-illustration-stroke bg-elements-headline rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/posts/${slug}`}>
        <h3 className="text-xl text-illustration-stroke font-semibold hover:underline">
          {title}
        </h3>
      </Link>
      <p className="text-xs text-illustration-highlight text-right mt-1">
        by {authorEmail} · {new Date(createdAt).toLocaleDateString("ja-JP")}
      </p>
      <p className="mt-2 text-illustration-stroke line-clamp-3">{content}</p>
    </article>
  );
}
