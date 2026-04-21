import { creatorProfile } from "./creator";
import { engineerProfile } from "./engineer";
import type { Profile, ProfileView } from "./types";

export const profiles: Record<ProfileView, Profile> = {
  creator: creatorProfile,
  engineer: engineerProfile,
};

export type { Profile, ProfileView } from "./types";
