import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/publicar", label: "Publicar" },
  { href: "/mis-anuncios", label: "Mis anuncios" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/contacto", label: "Contacto" },
];

export default function NavBar() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [conversationCount, setConversationCount] = useState(0);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId") || "";
    setUserId(storedUserId);
    setUserEmail(localStorage.getItem("userEmail") || "");

    if (!storedUserId) {
      setConversationCount(0);
      return;
    }

    fetch(`/api/conversaciones?userId=${encodeURIComponent(storedUserId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setConversationCount(Array.isArray(data) ? data.length : 0);
      })
      .catch(() => setConversationCount(0));
  }, []);

  const salir = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    setUserId("");
    setUserEmail("");
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

          {userId ? (
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
