import { ReactNode } from "react";
import Card from "@/app/components/Card";

type Item = {
  children: ReactNode;
  label: string;
  url?: string;
};

type Props = {
  items: Item[];
};

export default function CardList({ items }: Props) {
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {items.map((item) => (
        <Card key={item.label} {...item} />
      ))}
    </div>
  );
}
