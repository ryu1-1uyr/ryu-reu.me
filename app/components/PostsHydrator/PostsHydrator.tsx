"use client";

import { useEffect } from "react";
import { usePostsCache } from "@/app/contexts/PostsCache";
import type { PostItem } from "@/app/components/PostListView";

type Props = {
  posts: PostItem[];
};

// サーバーで取得した posts を Context（+ sessionStorage）に流し込む。
// 描画は何もしない。
export default function PostsHydrator({ posts }: Props) {
  const { setPosts } = usePostsCache();

  useEffect(() => {
    setPosts(posts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
