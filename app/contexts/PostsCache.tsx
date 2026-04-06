"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { PostItem } from "@/app/components/PostListView";

type PostsCacheContextType = {
  posts: PostItem[];
  setPosts: (posts: PostItem[]) => void;
};

const STORAGE_KEY = "posts_cache";

const PostsCacheContext = createContext<PostsCacheContextType>({
  posts: [],
  setPosts: () => {},
});

export function PostsCacheProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<PostItem[]>(() => {
    // リロード・直接アクセス時は sessionStorage から復元
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });

  const handleSetPosts = (newPosts: PostItem[]) => {
    setPosts(newPosts);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newPosts));
    } catch {}
  };

  return (
    <PostsCacheContext.Provider value={{ posts, setPosts: handleSetPosts }}>
      {children}
    </PostsCacheContext.Provider>
  );
}

export const usePostsCache = () => useContext(PostsCacheContext);
