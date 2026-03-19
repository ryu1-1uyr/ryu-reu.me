import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

export default function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  const href = (page: number) =>
    page === 1 ? basePath : `${basePath}?page=${page}`;

  return (
    <nav className="flex items-center justify-center gap-2 pt-6">
      {currentPage > 1 && (
        <Link
          href={href(currentPage - 1)}
          className="px-3 py-1 rounded text-sm text-elements-paragraph hover:text-elements-headline transition-colors"
        >
          ← 前へ
        </Link>
      )}

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-elements-paragraph/50">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={href(page)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              page === currentPage
                ? "bg-elements-button text-elements-background font-bold"
                : "text-elements-paragraph hover:text-elements-headline"
            }`}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={href(currentPage + 1)}
          className="px-3 py-1 rounded text-sm text-elements-paragraph hover:text-elements-headline transition-colors"
        >
          次へ →
        </Link>
      )}
    </nav>
  );
}
