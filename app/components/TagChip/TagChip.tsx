import Link from "next/link";

type Props = {
  tag: string;
  size?: "sm" | "md";
  className?: string;
};

const sizeClass = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
};

export default function TagChip({ tag, size = "sm", className = "" }: Props) {
  return (
    <Link
      href={`/blog?tag=${encodeURIComponent(tag)}`}
      className={`rounded-full bg-elements-button/20 text-elements-button hover:bg-elements-button/30 transition-colors ${sizeClass[size]} ${className}`}
    >
      {tag}
    </Link>
  );
}
