import { ReactNode } from "react";
import IconCard from "@/app/components/IconCard";

type Item = {
  icon: ReactNode;
  label: string;
  url: string;
};

type Props = {
  items: Item[];
};

export default function IconCardList({ items }: Props) {
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {items.map(({ icon, label, url }) => (
        <IconCard key={label} icon={icon} label={label} url={url} />
      ))}
    </div>
  );
}
