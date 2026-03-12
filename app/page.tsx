import { Suspense } from "react";
import ThreeDimensionalRoom from "@/app/Otameshi";
import PostList from "@/app/components/PostList";
import Image from "next/image";
import SampleImage from "@/public/konoka2.jpg";
import { FaXTwitter, FaYoutube, FaGithub } from "react-icons/fa6";
import { SiPixiv } from "react-icons/si";

export default function Home() {
  return (
    <main className="grid grid-cols-2 bg-elements-background min-h-screen ">
      <div className="text-elements-headline max-w-2xl mx-auto p-6 space-y-4">
        <div className="grid grid-cols-2 items-center gap-4 max-w-fit">
          <div className="w-20 h-20">
            <Image
              src={SampleImage.src}
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
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { emoji: "🎮", label: "ゲーム" },
              { emoji: "💻", label: "開発" },
              { emoji: "🎧", label: "音楽" },
              { emoji: "🎹", label: "作曲" },
              { emoji: "🎨", label: "お絵描き" },
            ].map(({ emoji, label }) => (
              <span
                key={emoji}
                className="relative group flex items-center justify-center w-12 h-12 rounded-xl bg-illustration-stroke border border-elements-paragraph/20 text-2xl cursor-default"
              >
                {emoji}
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-elements-paragraph/20 bg-illustration-stroke px-2 py-1 text-xs text-elements-paragraph opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  {label}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-elements-paragraph tracking-widest border-l-2 border-elements-button pl-2">
            Link
          </h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              {
                icon: <FaXTwitter />,
                label: "X",
                url: "https://x.com/reu_00_00",
              },
              {
                icon: <FaYoutube />,
                label: "YouTube",
                url: "https://www.youtube.com/@ryuryuuyr",
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
            ].map(({ icon, label, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                className="relative group flex items-center justify-center w-12 h-12 rounded-xl bg-illustration-stroke border border-elements-paragraph/20 text-2xl text-elements-paragraph hover:text-elements-headline hover:border-elements-paragraph/50 transition-colors duration-150"
              >
                {icon}
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-elements-paragraph/20 bg-illustration-stroke px-2 py-1 text-xs text-elements-paragraph opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
      {/* <ThreeDimensionalRoom /> */}
      <Suspense fallback={<p className="text-gray-400">読み込み中...</p>}>
        <PostList />
      </Suspense>
    </main>
  );
}
