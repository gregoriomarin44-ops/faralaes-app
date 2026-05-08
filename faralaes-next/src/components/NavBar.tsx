import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/authContext";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/publicar", label: "Publicar" },
  { href: "/mis-anuncios", label: "Mis anuncios" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/contacto", label: "Contacto" },
];

export default function NavBar() {
  const router = useRouter();
  const { user, clear } = useAuth();
  const [conversationCount, setConversationCount] = useState(0);

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

  const salir = async () => {
    await fetch("/api/logout", { method: "POST" }).catch(() => null);
    clear();
    setConversationCount(0);
    router.push("/catalogo");
  };

  return (
    <header className="border-b border-gray-200 bg-white/95 shadow-sm">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="font-serif text-2xl font-semibold text-red-800">
          Faralaes
        </Link>

        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-[#f8f3ef] hover:text-green-700"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                href="/mensajes"
                className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-[#f8f3ef] hover:text-green-700"
              >
                Mensajes ({conversationCount})
              </Link>
              <Link
                href="/perfil"
                className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-[#f8f3ef] hover:text-green-700"
              >
                Perfil
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-[#f8f3ef] hover:text-green-700"
                >
                  Admin
                </Link>
              )}
              {user.username && (
                <span className="whitespace-nowrap rounded-full bg-[#f8f3ef] px-4 py-2 text-sm font-semibold text-gray-600">
                  {user.displayName || `@${user.username}`}
                </span>
              )}
              <button
                type="button"
                onClick={salir}
                className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-[#f8f3ef] hover:text-red-700"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-[#f8f3ef] hover:text-green-700"
            >
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
