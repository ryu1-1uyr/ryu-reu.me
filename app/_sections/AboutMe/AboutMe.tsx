import Image from "next/image";
import IconImage from "@/public/me.png";
import { FaXTwitter, FaYoutube, FaGithub, FaDiscord } from "react-icons/fa6";
import { SiPixiv, SiSteam } from "react-icons/si";
import EmojiCardList from "@/app/components/EmojiCardList";
import IconCardList from "@/app/components/IconCardList";

const INTERESTS = [
  { emoji: "🎮", label: "ゲーム" },
  { emoji: "💻", label: "開発" },
  { emoji: "🎧", label: "音楽" },
  { emoji: "🎹", label: "作曲" },
  { emoji: "🎨", label: "お絵描き" },
];

const LINKS = [
  { icon: <FaXTwitter />, label: "X", url: "https://x.com/reu_00_00" },
  {
    icon: <FaYoutube />,
    label: "YouTube",
    url: "https://www.youtube.com/@ryuryuuyr",
  },
  {
    icon: <FaDiscord />,
    label: "Discord",
    url: "https://discord.com/users/333289660958638082",
  },
  {
    icon: <SiSteam />,
    label: "Steam",
    url: "https://steamcommunity.com/id/reu_o_o",
  },
  {
    icon: <FaGithub />,
    label: "GitHub",
    url: "https://github.com/ryu1-1uyr",
  },
  {
    icon: <SiPixiv />,
    label: "pixiv",
    url: "https://www.pixiv.net/users/27207159",
  },
];

export default function AboutMe() {
  return (
    <div className="text-elements-headline max-w-2xl mx-auto p-6 space-y-4">
      <div className="grid grid-cols-2 items-center gap-4 max-w-fit">
        <div className="w-20 h-20">
          <Image
            src={IconImage.src}
            alt="User Icon"
            width={80}
            height={80}
            className="p-1 bg-elements-headline rounded-full object-cover"
          />
        </div>
        <p className="text-xl font-bold">ReU</p>
      </div>
      <p className="text-elements-paragraph">
        お絵描きをしたり曲やソフトウェアを作ったりします。
        <br /> りゆう とか れう って呼んでください。
      </p>
      <p className="text-elements-paragraph">
        ここには日記とかの雑記をノージャンルで置いてます。
      </p>
      <div>
        <h2 className="text-sm font-semibold text-elements-paragraph tracking-widest border-l-2 border-elements-button pl-2">
          好きなもの
        </h2>
        <EmojiCardList items={INTERESTS} />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-elements-paragraph tracking-widest border-l-2 border-elements-button pl-2">
          Link
        </h2>
        <IconCardList items={LINKS} />
      </div>
    </div>
  );
}
