import { Suspense } from "react";
import PostList from "@/app/components/PostList";
import AboutMe from "@/app/_sections/AboutMe";

export default function Home() {
  return (
    <main className="grid grid-cols-1 md:grid-cols-2 bg-elements-background min-h-screen items-center">
      <AboutMe />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 rounded-full border-2 border-elements-paragraph/20 border-t-elements-button animate-spin" />
          </div>
        }
      >
        <PostList />
      </Suspense>
    </main>
  );
}
