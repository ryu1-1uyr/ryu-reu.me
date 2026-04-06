import Image from "next/image";
import IconImage from "@/public/me.png";
import { FaXTwitter, FaYoutube, FaGithub, FaDiscord } from "react-icons/fa6";
import { SiPixiv, SiSteam } from "react-icons/si";
import CardList from "@/app/components/CardList";

const INTERESTS = [
  { children: "🎮", label: "ゲーム" },
  { children: "💻", label: "開発" },
  { children: "🎧", label: "音楽" },
  { children: "🎹", label: "作曲" },
  { children: "🎨", label: "お絵描き" },
];

const LINKS = [
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
];

export default function AboutMe() {
  return (
    <div className="text-elements-headline px-5 py-8 md:p-6 space-y-5 md:space-y-4 min-h-[460px]">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 md:w-20 md:h-20 shrink-0">
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
      <div className="text-sm md:text-base text-elements-paragraph leading-relaxed space-y-1">
        <p>お絵描きをしたり曲やソフトウェアを作ったりします。</p>
        <p>りゆう とか れう って呼んでください。</p>
        <p>ここには日記とかの雑記をノージャンルで置いてます。</p>
      </div>
      <div className="mt-10">
        <div>
          <h2 className="text-sm font-semibold text-elements-paragraph tracking-widest border-l-2 border-elements-button pl-2">
            好きなもの
          </h2>
          <CardList items={INTERESTS} />
        </div>
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-elements-paragraph tracking-widest border-l-2 border-elements-button pl-2">
            Link
          </h2>
          <CardList items={LINKS} />
        </div>
      </div>
    </div>
  );
}
