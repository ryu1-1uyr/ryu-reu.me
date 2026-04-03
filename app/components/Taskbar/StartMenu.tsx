"use client";

import { useWindowManager, type WindowId } from "@/app/contexts/WindowManager";

type MenuItem = {
  id: WindowId;
  label: string;
  icon: string;
};

const MENU_ITEMS: MenuItem[] = [
  { id: "about-me", label: "about_me.exe", icon: "👤" },
  { id: "recent-posts", label: "recent_posts.log", icon: "📝" },
  { id: "yaogoromo", label: "yaogoromo.exe", icon: "🌤️" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function StartMenu({ open, onClose }: Props) {
  const { windows, openWindow } = useWindowManager();

  if (!open) return null;

  return (
    <div className="absolute bottom-full left-0 mb-1 w-56 rounded-lg border-2 border-illustration-stroke bg-elements-background/95 backdrop-blur-md shadow-[4px_4px_0px_0px_rgba(18,22,41,0.6)] overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-[#eebbc3] to-[#ff69b4] px-3 py-2 border-b-2 border-illustration-stroke">
        <span className="text-xs font-bold text-elements-background tracking-wider">
          りゆうの実験場
        </span>
      </div>

      {/* メニュー項目 */}
      <div className="py-1">
        {MENU_ITEMS.map((item) => {
          const isClosed = !windows[item.id].open;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                openWindow(item.id);
                onClose();
              }}
              className={`
                w-full text-left px-3 py-2 text-sm flex items-center gap-2
                hover:bg-elements-button/20 transition-colors
                ${
                  isClosed
                    ? "text-elements-headline"
                    : "text-elements-paragraph/50"
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {isClosed && (
                <span className="ml-auto text-[10px] text-elements-button">
                  起動
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* フッター */}
      <div className="border-t border-illustration-stroke/30 px-3 py-1.5">
        <span className="text-[10px] text-elements-paragraph/50">
          © 2026 created by ryu
        </span>
      </div>
    </div>
  );
}
