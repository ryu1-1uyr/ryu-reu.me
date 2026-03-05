import { Suspense } from "react";
import ThreeDimensionalRoom from "@/app/Otameshi";
import PostList from "@/app/components/PostList";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <p>こにちわ～</p>
      {/* <ThreeDimensionalRoom /> */}
      <Suspense fallback={<p className="text-gray-400">読み込み中...</p>}>
        <PostList />
      </Suspense>
    </main>
  );
}
