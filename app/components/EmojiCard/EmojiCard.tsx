type Props = {
  emoji: string;
  label: string;
};

export default function EmojiCard({ emoji, label }: Props) {
  return (
    <span className="relative group flex items-center justify-center w-12 h-12 rounded-xl bg-illustration-stroke border border-elements-paragraph/20 text-2xl cursor-default">
      {emoji}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-elements-paragraph/20 bg-illustration-stroke px-2 py-1 text-xs text-elements-paragraph opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
