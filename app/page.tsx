import { Suspense } from "react";
import PostList from "@/app/components/PostList";
import AboutMe from "@/app/_sections/AboutMe";
import WeatherControl from "@/app/_sections/WeatherControl";
import DrawingCanvas from "@/app/_sections/DrawingCanvas";
import Desktop from "@/app/_sections/Desktop";

export default function Home() {
  return (
    <Desktop
      contents={{
        "about-me": <AboutMe />,
        "recent-posts": (
          <div className="p-6 space-y-4 w-[444px]">
            <h2 className="text-sm font-semibold text-elements-headline tracking-widest border-l-2 border-elements-button pl-2">
              最近の戯言
            </h2>
            <Suspense
              fallback={
                <div className="space-y-3 min-h-[480px]">
                  <p className="text-sm text-elements-paragraph">
                    記事を取得中...
                  </p>
                  <div className="h-2 rounded-full bg-illustration-stroke/20 overflow-hidden">
                    <div className="h-full rounded-full bg-elements-button animate-loading-bar" />
                  </div>
                </div>
              }
            >
              <PostList />
            </Suspense>
          </div>
        ),
        yaogoromo: <WeatherControl />,
        "drawing-canvas": <DrawingCanvas />,
      }}
    />
  );
}
