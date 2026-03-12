import EmojiCard from "@/app/components/EmojiCard";

type Item = {
  emoji: string;
  label: string;
};

type Props = {
  items: Item[];
};

export default function EmojiCardList({ items }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map(({ emoji, label }) => (
        <EmojiCard key={emoji} emoji={emoji} label={label} />
      ))}
    </div>
  );
}
