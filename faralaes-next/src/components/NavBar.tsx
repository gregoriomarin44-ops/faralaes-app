import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../lib/authContext";

const categoryLinks = [
  { href: "/catalogo?categoria=traje", label: "Trajes" },
  { href: "/catalogo?categoria=zapatos", label: "Zapatos" },
  { href: "/catalogo?categoria=complementos", label: "Complementos" },
  { href: "/catalogo?categoria=nina", label: "Niña" },
  { href: "/catalogo?categoria=hombre", label: "Hombre" },
  { href: "/catalogo?categoria=mantoncillo", label: "Mantones" },
];

const menuLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/mis-anuncios", label: "Mis anuncios" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/contacto", label: "Contacto" },
];

export default function NavBar() {
  const router = useRouter();
  const { user, clear } = useAuth();
  const [conversationCount, setConversationCount] = useState(0);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (!user) {
      setConversationCount(0);
      return;
    }

    fetch("/api/conversaciones")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setConversationCount(Array.isArray(data) ? data.length : 0);
      })
      .catch(() => setConversationCount(0));
  }, [user]);

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
    setConversationCount(0);
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

  const avatarLabel = (
    user?.displayName ||
    user?.username ||
    user?.email ||
    "F"
  ).trim();
  const avatarInitial = avatarLabel.charAt(0).toUpperCase() || "F";

  const menuPanel = (
    <div className="fixed right-4 top-20 z-[70] w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl md:right-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] md:top-16">
      <div className="border-b border-stone-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
          Faralaes
        </p>
        <p className="mt-1 text-sm font-semibold text-stone-900">
          {user ? "Tu cuenta" : "Marketplace flamenco"}
        </p>
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
            Mensajes{conversationCount > 0 ? ` (${conversationCount})` : ""}
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
              {conversationCount > 0 && (
                <span className="ml-1 rounded-full bg-red-800 px-1.5 py-0.5 text-[11px] leading-none text-white">
                  {conversationCount}
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
              className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-bold text-red-900 transition hover:border-red-900 hover:bg-[#f8f3ef]"
              aria-label="Abrir menú de usuario"
              aria-expanded={menuOpen}
            >
              {user ? avatarInitial : (
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
            <Link
              key={category.href}
              href={category.href}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-stone-700 transition hover:bg-[#f8f3ef] hover:text-red-800"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </div>
      </header>
    </>
  );
}
