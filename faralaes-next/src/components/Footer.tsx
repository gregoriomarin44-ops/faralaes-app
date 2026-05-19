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
    <footer className="border-t border-stone-200 bg-white text-stone-800">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-[1.35fr_1fr_1fr_1fr_1fr] md:gap-9 md:py-14">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Link
            href="/"
            prefetch={false}
            className="font-serif text-4xl font-semibold text-red-900"
          >
            Faralaes
          </Link>
          <p className="mt-3 text-sm font-bold uppercase tracking-widest text-green-800">
            Marketplace flamenco
          </p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-stone-600">
            Compra y vende trajes de flamenca, mantoncillos, pendientes y
            complementos flamencos de segunda mano en una comunidad especializada.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
            {["Instagram", "TikTok", "Pinterest"].map((network) => (
              <span
                key={network}
                className="rounded-full border border-stone-200 bg-[#f8f3ef] px-3 py-1.5 text-xs font-black text-stone-600"
              >
                {network}
              </span>
            ))}
          </div>
        </div>

        <FooterColumn title="Principal" links={mainLinks} />
        <FooterColumn title="Moda flamenca" links={primarySeoFooterLinks} />
        <FooterColumn title="Usuario" links={userLinks} />
        <FooterColumn title="Legal" links={legalLinks} />
      </div>

      <div className="border-t border-stone-200 bg-[#f8f3ef] px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-center text-sm text-stone-500 md:flex-row md:items-center md:justify-between md:text-left">
          <p>© 2026 Faralaes. Todos los derechos reservados.</p>
          <p className="font-semibold text-stone-600">
            Hay trajes que merecen otra feria.
          </p>
        </div>
      </div>
    </footer>
  );
}
