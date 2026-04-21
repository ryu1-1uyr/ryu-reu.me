import type { ReactNode } from "react";

export type ProfileView = "creator" | "engineer";

export type InterestItem = {
  children: ReactNode;
  label: string;
};

export type LinkItem = {
  children: ReactNode;
  label: string;
  url: string;
};

export type Profile = {
  displayName: string;
  bio: string[];
  interests: InterestItem[];
  links: LinkItem[];
};
