import { FaXTwitter, FaGithub } from "react-icons/fa6";
import type { Profile } from "./types";

// TODO: 文言・interests・links は後で差し替え予定（ダミー）
export const engineerProfile: Profile = {
  displayName: "ryu",
  bio: [
    "ソフトウェアエンジニアです。（ダミー：あとで差し替え）",
    "Web フロントエンド中心に作ってます。",
    "ここには技術メモや作ったものの話を置いてます。",
  ],
  interests: [
    { children: "💻", label: "開発" },
    { children: "🧪", label: "実験" },
    { children: "📚", label: "読書" },
    { children: "☕", label: "コーヒー" },
    { children: "🎮", label: "ゲーム" },
  ],
  links: [
    {
      children: <FaGithub />,
      label: "GitHub",
      url: "https://github.com/ryu1-1uyr",
    },
    { children: <FaXTwitter />, label: "X", url: "https://x.com/reu_00_00" },
  ],
};
