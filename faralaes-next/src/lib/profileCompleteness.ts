type ProfileLike = {
  displayName?: string | null;
  location?: string | null;
} | null;

export const isProfileComplete = (profile: ProfileLike) =>
  Boolean(profile?.displayName?.trim() && profile.location?.trim());
