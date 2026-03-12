import { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  url: string;
};

export default function IconCard({ icon, label, url }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative group flex items-center justify-center w-12 h-12 rounded-xl bg-illustration-stroke border border-elements-paragraph/20 text-2xl text-elements-paragraph hover:text-elements-headline hover:border-elements-paragraph/50 transition-colors duration-150"
    >
      {icon}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-elements-paragraph/20 bg-illustration-stroke px-2 py-1 text-xs text-elements-paragraph opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </a>
  );
}
