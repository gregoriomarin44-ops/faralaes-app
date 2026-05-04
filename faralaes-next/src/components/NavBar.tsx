import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/publicar", label: "Publicar" },
  { href: "/mis-anuncios", label: "Mis anuncios" },
  { href: "/favoritos", label: "Favoritos" },
];

export default function NavBar() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    setUserId(localStorage.getItem("userId") || "");
    setUserEmail(localStorage.getItem("userEmail") || "");
  }, []);

  const salir = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    setUserId("");
    setUserEmail("");
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

          {userId ? (
            <>
              {userEmail && (
                <span className="whitespace-nowrap rounded-full bg-[#f8f3ef] px-4 py-2 text-sm font-semibold text-gray-600">
                  {userEmail}
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
