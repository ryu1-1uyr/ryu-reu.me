import Image from "next/image";
import { cookies } from "next/headers";
import CardList from "@/app/components/CardList";
import { profiles } from "./profiles";
import { resolveProfileView } from "./resolveProfileView";

type Props = {
  view?: string;
};

export default async function AboutMe({ view }: Props) {
  const cookieStore = await cookies();
  const cookieView = cookieStore.get("profile_view")?.value;
  const resolved = resolveProfileView({ query: view, cookie: cookieView });
  const profile = profiles[resolved];

  return (
    <div className="text-elements-headline px-5 py-8 md:p-6 space-y-5 md:space-y-4 min-h-[460px]">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 md:w-20 md:h-20 shrink-0">
          <Image
            src={profile.icon.src}
            alt="User Icon"
            width={80}
            height={80}
            className="p-1 bg-elements-headline rounded-full object-cover"
          />
        </div>
        <p className="text-xl font-bold">{profile.displayName}</p>
      </div>
      <div className="text-sm md:text-base text-elements-paragraph leading-relaxed space-y-1">
        {profile.bio.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <div className="mt-10">
        <div>
          <h2 className="text-sm font-semibold text-elements-paragraph tracking-widest border-l-2 border-elements-button pl-2">
            好きなもの
          </h2>
          <CardList items={profile.interests} />
        </div>
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-elements-paragraph tracking-widest border-l-2 border-elements-button pl-2">
            Link
          </h2>
          <CardList items={profile.links} />
        </div>
      </div>
    </div>
  );
}
