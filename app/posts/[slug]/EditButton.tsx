"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function EditButton({ slug }: { slug: string }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  if (!isLoggedIn) return null;

  return (
    <Link
      href={`/update/${encodeURIComponent(slug)}`}
      className="w-9 h-9 rounded-full bg-elements-headline flex items-center justify-center hover:opacity-80 transition-opacity group relative"
      aria-label="記事を編集"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 fill-none stroke-gray-800 stroke-2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        />
      </svg>
      <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1 rounded-md bg-elements-headline text-gray-800 text-xs whitespace-nowrap shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        編集する
      </span>
    </Link>
  );
}
