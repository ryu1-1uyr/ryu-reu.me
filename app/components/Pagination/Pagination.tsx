import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  extraParams?: Record<string, string>;
};

export default function Pagination({ currentPage, totalPages, basePath, extraParams }: Props) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  const href = (page: number) => {
    const params = new URLSearchParams(extraParams);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

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
