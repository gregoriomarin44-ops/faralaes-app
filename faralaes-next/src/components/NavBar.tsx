import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/publicar", label: "Publicar" },
  { href: "/mis-anuncios", label: "Mis anuncios" },
  { href: "/login", label: "Entrar" },
];

export default function NavBar() {
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
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-[#f8f3ef] hover:text-green-700"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
