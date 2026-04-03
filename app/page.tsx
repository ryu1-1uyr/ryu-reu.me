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
          <Suspense
            fallback={
              <div className="flex items-center justify-center w-[444px] h-[630px] p-12">
                <div className="w-8 h-8 rounded-full border-2 border-elements-paragraph/20 border-t-elements-button animate-spin" />
              </div>
            }
          >
            <PostList />
          </Suspense>
        ),
        yaogoromo: <WeatherControl />,
        "drawing-canvas": <DrawingCanvas />,
      }}
    />
  );
}
