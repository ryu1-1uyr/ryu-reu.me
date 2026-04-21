import { FaXTwitter, FaYoutube, FaGithub, FaDiscord } from "react-icons/fa6";
import { SiPixiv, SiSteam } from "react-icons/si";
import IconImage from "@/public/me.png";
import type { Profile } from "./types";

export const creatorProfile: Profile = {
  displayName: "ReU",
  icon: IconImage,
  bio: [
    "お絵描きをしたり曲やソフトウェアを作ったりします。",
    "りゆう とか れう って呼んでください。",
    "ここには日記とかの雑記をノージャンルで置いてます。",
  ],
  interests: [
    { children: "🎮", label: "ゲーム" },
    { children: "💻", label: "開発" },
    { children: "🎧", label: "音楽" },
    { children: "🎹", label: "作曲" },
    { children: "🎨", label: "お絵描き" },
  ],
  links: [
    { children: <FaXTwitter />, label: "X", url: "https://x.com/reu_00_00" },
    {
      children: <FaYoutube />,
      label: "YouTube",
      url: "https://www.youtube.com/@ryuryuuyr",
    },
    {
      children: <FaDiscord />,
      label: "Discord",
      url: "https://discord.com/users/333289660958638082",
    },
    {
      children: <SiSteam />,
      label: "Steam",
      url: "https://steamcommunity.com/id/reu_o_o",
    },
    {
      children: <FaGithub />,
      label: "GitHub",
      url: "https://github.com/ryu1-1uyr",
    },
    {
      children: <SiPixiv />,
      label: "pixiv",
      url: "https://www.pixiv.net/users/27207159",
    },
  ],
};
