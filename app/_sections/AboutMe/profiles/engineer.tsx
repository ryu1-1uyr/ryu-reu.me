import { FaXTwitter, FaGithub } from "react-icons/fa6";
import IconImage from "@/public/ryu.jpg";
import type { Profile } from "./types";

export const engineerProfile: Profile = {
  displayName: "ryu",
  icon: IconImage,
  bio: [
    "ソフトウェアエンジニアやってます。",
    "Web フロントエンド中心に作ってます。",
    "ここには技術メモや作ったものの話を置いてます。",
  ],
  interests: [
    { children: "🎮", label: "ゲーム" },
    { children: "💻", label: "開発" },
    { children: "🎧", label: "音楽" },
    { children: "🎹", label: "作曲" },
    { children: "🎨", label: "お絵描き" },
  ],
  links: [
    {
      children: <FaGithub />,
      label: "GitHub",
      url: "https://github.com/ryu1-1uyr",
    },
    { children: <FaXTwitter />, label: "X", url: "https://x.com/Ryu1__1uyR" },
  ],
};
