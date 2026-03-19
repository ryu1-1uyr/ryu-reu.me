import Link from "next/link";

type Props = {
  id: string;
  slug: string;
  title: string;
  authorEmail: string;
  createdAt: Date;
  content: string;
};

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // ![alt](url)
    .replace(/<[^>]+>/g, "") // HTML タグ全除去
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](url) → text
    .replace(/#{1,6}\s+/g, "") // 見出し
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1") // bold/italic
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // inline code
    .replace(/\n{2,}/g, " ") // 連続改行
    .trim();
}

export default function PostCard({
  slug,
  title,
  authorEmail,
  createdAt,
  content,
}: Props) {
  const preview = stripMarkdown(content);

  return (
    <article className="border border-illustration-stroke bg-elements-headline rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/posts/${slug}`}>
        <h3 className="text-xl text-illustration-stroke font-semibold hover:underline">
          {title}
        </h3>
      </Link>
      <p className="text-xs text-illustration-highlight text-right mt-1">
        by reu · {new Date(createdAt).toLocaleDateString("ja-JP")}
      </p>
      <p className="mt-2 text-illustration-stroke line-clamp-3">{preview}</p>
    </article>
  );
}
