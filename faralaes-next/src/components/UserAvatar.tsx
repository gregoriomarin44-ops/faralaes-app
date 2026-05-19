import { useEffect, useState, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
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
  expandable?: boolean;
  imageAlt?: string;
};

export default function UserAvatar({
  user,
  size = "sm",
  className = "",
  expandable = false,
  imageAlt,
}: UserAvatarProps) {
  const avatarUrl = user.avatarUrl?.trim();
  const canExpand = Boolean(expandable && avatarUrl);
  const [isOpen, setIsOpen] = useState(false);
  const label =
    imageAlt ||
    user.displayName?.trim() ||
    (user.username ? `@${user.username}` : "Avatar");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const openAvatar = (event: MouseEvent<HTMLSpanElement>) => {
    if (!canExpand) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsOpen(true);
  };

  const handleAvatarKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (!canExpand || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsOpen(true);
  };

  return (
    <>
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-stone-950 to-red-900 font-black text-white shadow-sm ${sizeClasses[size]} ${className} ${
          canExpand
            ? "cursor-zoom-in outline-none transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
            : ""
        }`}
        aria-hidden={canExpand ? undefined : "true"}
        aria-label={canExpand ? `Ampliar ${label}` : undefined}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        onClick={openAvatar}
        onKeyDown={handleAvatarKeyDown}
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

      {isOpen &&
        avatarUrl &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 px-4 py-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={() => setIsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl leading-none text-white shadow-lg backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Cerrar imagen"
            >
              ×
            </button>
            <div
              className="flex max-h-[86vh] max-w-[min(92vw,44rem)] items-center justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={avatarUrl}
                alt={label}
                className="max-h-[86vh] max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/15"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
