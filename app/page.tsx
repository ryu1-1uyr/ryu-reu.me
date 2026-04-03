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
            <div className="flex items-center justify-center p-12">
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
