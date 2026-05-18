import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../lib/authContext";
import { categoryOptions } from "../lib/listingOptions";
import PwaInstallBanner from "./PwaInstallBanner";

const categoryLinks = categoryOptions.map((category) => ({
  value: category.value,
  label: category.label,
}));

const menuLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/mis-anuncios", label: "Mis anuncios" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/contacto", label: "Contacto" },
];

type AvatarUser = {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
};

const getUserName = (user: AvatarUser | null) =>
  user?.displayName?.trim() || user?.username?.trim() || "";

const getUserSecondaryText = (user: AvatarUser | null) => {
  if (!user) {
    return "";
  }

  const username = user.username?.trim();
  const email = user.email?.trim();

  if (username) {
    return `@${username}`;
  }

  return email || "";
};

const getAvatarLabel = (user: AvatarUser | null) =>
  (getUserName(user) || user?.email || "F").trim();

const getAvatarInitial = (user: AvatarUser | null) =>
  getAvatarLabel(user).charAt(0).toUpperCase() || "F";

const getAvatarUrl = (user: AvatarUser | null) =>
  user?.avatarUrl?.trim() || user?.image?.trim() || "";

function UserAvatar({
  user,
  size = "sm",
}: {
  user: AvatarUser | null;
  size?: "sm" | "lg";
}) {
  const avatarUrl = getAvatarUrl(user);
  const avatarInitial = getAvatarInitial(user);
  const sizeClass = size === "lg" ? "h-14 w-14 text-xl" : "h-8 w-8 text-sm";

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-red-900 to-stone-950 font-bold text-white shadow-sm ${sizeClass}`}
      aria-hidden="true"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        avatarInitial
      )}
    </span>
  );
}

export default function NavBar() {
  const router = useRouter();
  const { user, clear } = useAuth();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (!user) {
      setUnreadMessageCount(0);
      return;
    }

    const loadUnreadMessageCount = () => {
      fetch("/api/mensajes/unread-count")
        .then((res) => (res.ok ? res.json() : { count: 0 }))
        .then((data) => {
          setUnreadMessageCount(
            typeof data?.count === "number" ? data.count : 0
          );
        })
        .catch(() => setUnreadMessageCount(0));
    };

    const handleUnreadMessagesChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ count?: number }>).detail;

      if (typeof detail?.count === "number") {
        setUnreadMessageCount(detail.count);
        return;
      }

      loadUnreadMessageCount();
    };

    loadUnreadMessageCount();
    window.addEventListener(
      "faralaes:unread-messages-changed",
      handleUnreadMessagesChanged
    );
    const intervalId = window.setInterval(loadUnreadMessageCount, 15000);

    return () => {
      window.removeEventListener(
        "faralaes:unread-messages-changed",
        handleUnreadMessagesChanged
      );
      window.clearInterval(intervalId);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    fetch("/api/mensajes/unread-count")
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => {
        setUnreadMessageCount(typeof data?.count === "number" ? data.count : 0);
      })
      .catch(() => null);
  }, [router.asPath, user]);

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 8);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const query = router.query.q;
    setSearch(typeof query === "string" ? query : "");
  }, [router.query.q]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const salir = async () => {
    await fetch("/api/logout", { method: "POST" }).catch(() => null);
    clear();
    setUnreadMessageCount(0);
    setMenuOpen(false);
    router.push("/catalogo");
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = search.trim();
    setMenuOpen(false);

    router.push({
      pathname: "/catalogo",
      query: query ? { q: query } : undefined,
    });
  };

  const openCategory = (category: string) => {
    router.push({
      pathname: "/catalogo",
      query: { categoria: category },
    });
  };

  const userDisplayName = getUserName(user) || "Tu cuenta";
  const userSecondaryText = getUserSecondaryText(user);

  const menuPanel = (
    <div className="fixed right-4 top-20 z-[70] w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl md:right-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] md:top-16">
      <div className="border-b border-stone-100 px-4 py-4">
        {user ? (
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
                Tu cuenta
              </p>
              <p className="mt-1 truncate text-sm font-bold text-stone-950">
                {userDisplayName}
              </p>
              {userSecondaryText && (
                <p className="truncate text-xs font-medium text-stone-500">
                  {userSecondaryText}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
              Faralaes
            </p>
            <p className="mt-1 text-sm font-semibold text-stone-900">
              Marketplace flamenco
            </p>
          </>
        )}
      </div>

      <div className="p-2">
        {menuLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            className="block rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-[#f8f3ef] hover:text-red-800"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/favoritos"
          onClick={() => setMenuOpen(false)}
          className="block rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-[#f8f3ef] hover:text-red-800 sm:hidden"
        >
          Favoritos
        </Link>
        {user && (
          <Link
            href="/mensajes"
            onClick={() => setMenuOpen(false)}
            className="block rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-[#f8f3ef] hover:text-red-800 sm:hidden"
          >
            Mensajes{unreadMessageCount > 0 ? ` (${unreadMessageCount})` : ""}
          </Link>
        )}
        {user ? (
          <>
            <Link
              href="/perfil"
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-[#f8f3ef] hover:text-red-800"
            >
              Perfil
            </Link>
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-[#f8f3ef] hover:text-red-800"
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={salir}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-800 transition hover:bg-red-50"
            >
              Salir
            </button>
          </>
        ) : (
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="block rounded-xl px-3 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-50"
          >
            Entrar
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] cursor-default bg-black/20 md:bg-black/10"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          {menuPanel}
        </>
      )}

      <header
        className={`sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur transition-shadow ${
          hasScrolled
            ? "shadow-[0_10px_30px_rgba(34,24,20,0.10)]"
            : "shadow-none"
        }`}
      >
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 md:flex-nowrap md:px-6">
        <Link
          href="/"
          className="shrink-0 font-serif text-2xl font-semibold leading-none text-red-900 md:text-[1.7rem]"
          aria-label="Faralaes"
        >
          Faralaes
        </Link>

        <form
          onSubmit={submitSearch}
          className="order-3 flex min-h-11 min-w-0 flex-1 basis-full items-center rounded-full border border-stone-200 bg-[#faf7f4] px-4 py-2.5 text-sm shadow-inner transition focus-within:border-red-800 focus-within:bg-white md:order-none md:min-h-0 md:basis-auto md:px-4 md:py-2"
        >
          <span className="mr-2 text-base text-stone-500" aria-hidden="true">
            &#128269;
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-500"
            placeholder="Buscar trajes, zapatos, mantones..."
            type="search"
            aria-label="Buscar en el catálogo"
          />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2">
          <Link
            href="/favoritos"
            className="hidden h-10 items-center rounded-full px-3 text-sm font-semibold text-stone-700 transition hover:bg-[#f8f3ef] hover:text-red-800 sm:flex"
          >
            Favoritos
          </Link>

          {user && (
            <Link
              href="/mensajes"
              className="relative hidden h-10 items-center rounded-full px-3 text-sm font-semibold text-stone-700 transition hover:bg-[#f8f3ef] hover:text-red-800 sm:flex"
            >
              Mensajes
              {unreadMessageCount > 0 && (
                <span className="ml-1 rounded-full bg-red-800 px-1.5 py-0.5 text-[11px] leading-none text-white">
                  {unreadMessageCount}
                </span>
              )}
            </Link>
          )}

          <Link
            href="/publicar"
            className="rounded-full bg-gradient-to-r from-stone-950 to-red-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:from-red-950 hover:to-stone-950 md:px-5"
          >
            Publicar
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={`flex h-10 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-bold text-red-900 transition hover:border-red-900 hover:bg-[#f8f3ef] ${
                user
                  ? "max-w-[12rem] gap-2 px-1.5 pr-3"
                  : "w-10"
              }`}
              aria-label="Abrir menú de usuario"
              aria-expanded={menuOpen}
            >
              {user ? (
                <>
                  <UserAvatar user={user} />
                  <span className="hidden min-w-0 max-w-[8.5rem] truncate text-left text-xs font-bold leading-tight text-stone-900 sm:block">
                    {userDisplayName}
                  </span>
                </>
              ) : (
                <span className="flex flex-col gap-1" aria-hidden="true">
                  <span className="block h-0.5 w-4 bg-current" />
                  <span className="block h-0.5 w-4 bg-current" />
                  <span className="block h-0.5 w-4 bg-current" />
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className="border-t border-stone-100 bg-white/90">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2 md:px-6">
          {categoryLinks.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => openCategory(category.value)}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-stone-700 transition hover:bg-[#f8f3ef] hover:text-red-800"
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      <PwaInstallBanner />
      </header>
    </>
  );
}
