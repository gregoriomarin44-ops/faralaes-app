import Link from "next/link";
import { primarySeoFooterLinks } from "../lib/seo";

const mainLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/como-funciona", label: "Cómo funciona" },
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
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/cookies", label: "Cookies" },
  { href: "/condiciones", label: "Condiciones" },
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
    <div className="text-center md:text-left">
      <h2 className="text-sm font-bold uppercase tracking-widest text-stone-500">
        {title}
      </h2>
      <nav
        aria-label={`Footer ${title}`}
        className="mt-4 flex flex-col items-center gap-3 md:items-start"
      >
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
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] md:gap-10 md:py-12">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
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
        <FooterColumn title="Moda flamenca" links={primarySeoFooterLinks} />
        <FooterColumn title="Usuario" links={userLinks} />
        <FooterColumn title="Legal" links={legalLinks} />
      </div>

      <div className="border-t border-stone-200 px-6 py-5">
        <p className="mx-auto max-w-6xl text-center text-sm text-stone-500 md:text-left">
          © 2026 Faralaes. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
