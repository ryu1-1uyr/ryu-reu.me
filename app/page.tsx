import { Suspense } from "react";
import PostList from "@/app/components/PostList";
import AboutMe from "@/app/_sections/AboutMe";
import Desktop from "@/app/_sections/Desktop";

export default function Home() {
  return (
    <Desktop
      aboutMe={<AboutMe />}
      postList={
        <Suspense
          fallback={
            // TODO: w-[444px] h-[630px]はスケルトン的な対応で入れている。なんかもっとうまくやり方を探りたい
            <div className="flex items-center justify-center w-[444px] h-[630px] p-12">
              <div className="w-8 h-8 rounded-full border-2 border-elements-paragraph/20 border-t-elements-button animate-spin" />
            </div>
          }
        >
          <PostList />
        </Suspense>
      }
    />
  );
}
