import Link from "next/link";

const mainLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/publicar", label: "Publicar anuncio" },
  { href: "/contacto", label: "Contacto" },
];

const userLinks = [
  { href: "/mis-anuncios", label: "Mis anuncios" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/mensajes", label: "Mensajes" },
  { href: "/perfil", label: "Perfil" },
];

const legalLinks = [
  { href: "/privacidad", label: "Privacidad" },
  { href: "/cookies", label: "Cookies" },
  { href: "/terminos", label: "Términos" },
];

type FooterLink = {
  href: string;
  label: string;
};

function FooterColumn({
  links,
  title,
}: {
  links: FooterLink[];
  title: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-widest text-stone-500">
        {title}
      </h2>
      <nav aria-label={`Footer ${title}`} className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            prefetch={false}
            className="text-sm font-semibold text-stone-700 transition hover:text-green-800"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-[#f8f3ef] text-stone-800">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link
            href="/"
            prefetch={false}
            className="font-serif text-3xl font-semibold text-red-800"
          >
            Faralaes
          </Link>
          <p className="mt-3 text-sm font-bold uppercase tracking-widest text-green-800">
            Tu compraventa flamenca
          </p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-stone-600">
            Compra y vende trajes, complementos y prendas flamencas de forma
            sencilla.
          </p>
        </div>

        <FooterColumn title="Principal" links={mainLinks} />
        <FooterColumn title="Usuario" links={userLinks} />
        <FooterColumn title="Legal" links={legalLinks} />
      </div>

      <div className="border-t border-stone-200 px-6 py-5">
        <p className="mx-auto max-w-6xl text-sm text-stone-500">
          © 2026 Faralaes. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
