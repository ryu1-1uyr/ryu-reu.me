type TitleBarColor = "pink" | "blue" | "teal" | "orange";

type Props = {
  title: string;
  color?: TitleBarColor;
  children: React.ReactNode;
  className?: string;
};

const BAR_COLORS: Record<TitleBarColor, string> = {
  pink: "bg-gradient-to-r from-[#eebbc3] to-[#ff69b4]",
  blue: "bg-gradient-to-r from-[#232946] to-[#4a6fa5]",
  teal: "bg-gradient-to-r from-[#2a9d8f] to-[#40c9a2]",
  orange: "bg-gradient-to-r from-[#f2c57c] to-[#e09f3e]",
};

export default function RetroWindow({
  title,
  color = "pink",
  children,
  className = "",
}: Props) {
  return (
    <div
      className={`
        rounded-lg overflow-hidden
        border-2 border-illustration-stroke
        shadow-[4px_4px_0px_0px_rgba(18,22,41,0.6)]
        ${className}
      `}
    >
      {/* タイトルバー */}
      <div
        className={`
          ${BAR_COLORS[color]}
          flex items-center justify-between
          px-3 py-1.5
          border-b-2 border-illustration-stroke
        `}
      >
        <span className="text-xs font-bold text-elements-background tracking-wider truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="w-3 h-3 rounded-sm border border-elements-background/40 bg-elements-background/20 flex items-center justify-center text-[8px] leading-none text-elements-background/70">
            ─
          </span>
          <span className="w-3 h-3 rounded-sm border border-elements-background/40 bg-elements-background/20 flex items-center justify-center text-[8px] leading-none text-elements-background/70">
            □
          </span>
          <span className="w-3 h-3 rounded-sm border border-elements-background/40 bg-[#ff69b4] flex items-center justify-center text-[8px] leading-none text-elements-background">
            ✕
          </span>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="bg-elements-background/90 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
