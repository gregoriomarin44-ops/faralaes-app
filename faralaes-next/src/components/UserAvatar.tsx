import { getInitial } from "../lib/userIdentity";

export type AvatarUser = {
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
};

const sizeClasses = {
  xs: "h-8 w-8 text-xs",
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-xl",
  lg: "h-20 w-20 text-3xl",
  xl: "h-28 w-28 text-4xl",
};

type UserAvatarProps = {
  user: AvatarUser;
  size?: keyof typeof sizeClasses;
  className?: string;
};

export default function UserAvatar({
  user,
  size = "sm",
  className = "",
}: UserAvatarProps) {
  const avatarUrl = user.avatarUrl?.trim();

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-stone-950 to-red-900 font-black text-white shadow-sm ${sizeClasses[size]} ${className}`}
      aria-hidden="true"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        getInitial(user.displayName, user.username)
      )}
    </span>
  );
}
