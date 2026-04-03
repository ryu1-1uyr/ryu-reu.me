"use client";

import { useState, useRef, useEffect } from "react";
import { useWindowManager, type WindowId } from "@/app/contexts/WindowManager";
import StartMenu from "./StartMenu";
import { useIsClient } from "@/app/hooks/useIsClient";

type TaskbarItem = {
  id: WindowId;
  label: string;
};

const TASKBAR_ITEMS: TaskbarItem[] = [
  { id: "about-me", label: "about_me" },
  { id: "recent-posts", label: "posts" },
];

const EMOJI_LIST = ["🌊", "🚀", "🌟", "🎉", "🦕", "🍕", "⚡️", "💻"];

export default function Taskbar() {
  const isClient = useIsClient();
  // const { windows, focusWindow, openWindow } = useWindowManager();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedEmoji, setEmoji] = useState(() => {
    return isClient
      ? EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)]
      : "🚀";
  });
  console.log(isClient, "isClient");

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [menuOpen]);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-10 bg-elements-background/90 backdrop-blur-md border-t-2 border-illustration-stroke flex items-center px-2 gap-1">
      <div ref={menuRef} className="relative">
        <StartMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        <button
          type="button"
          onClick={() => {
            setEmoji(EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)]);
            setMenuOpen((v) => !v);
          }}
          className={`
            h-7 px-3 rounded text-xs font-bold flex items-center gap-1.5
            border border-illustration-stroke
            transition-colors
            ${
              menuOpen
                ? "bg-elements-button text-elements-background"
                : "bg-gradient-to-r from-[#eebbc3] to-[#b8c1ec] text-elements-background hover:brightness-110"
            }
          `}
        >
          {/* const selected = fruits.at(Math.random() * fruits.length); */}
          <span className="text-sm">{selectedEmoji}</span>
          <span>Start</span>
        </button>
      </div>

      {/* 区切り線 */}
      <div className="w-px h-6 bg-illustration-stroke/30 mx-1" />

      {/* なんかちょい微妙 */}
      {/* {TASKBAR_ITEMS.map((item) => {
        const win = windows[item.id];
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (win.open) {
                focusWindow(item.id);
              } else {
                openWindow(item.id);
              }
            }}
            className={`
              h-7 px-3 rounded text-xs font-bold
              border border-illustration-stroke
              transition-colors truncate max-w-[120px]
              ${
                win.open
                  ? "bg-elements-background/60 text-elements-headline border-elements-button/50 shadow-inner"
                  : "bg-elements-background/30 text-elements-paragraph/50 hover:bg-elements-background/50"
              }
            `}
          >
            {item.label}
          </button>
        );
      })} */}

      {/* 右側: 時計 */}
      <div className="ml-auto text-[10px] text-elements-paragraph/70 border-l border-illustration-stroke/30 pl-2 tabular-nums">
        <Clock />
      </div>
    </footer>
  );
}

function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  return <span>{time}</span>;
}
