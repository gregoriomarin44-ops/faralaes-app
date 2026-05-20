import Link from "next/link";
import { useState } from "react";
import {
  copyListingLink,
  getFacebookShareUrl,
  INSTAGRAM_PROFILE_URL,
} from "../lib/listingShare";
import { SITE_URL, primarySeoFooterLinks } from "../lib/seo";
import SocialIcon from "./SocialIcon";

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

const whatsappFooterUrl = `https://wa.me/?text=${encodeURIComponent(
  `Descubre Faralaes, el marketplace de moda flamenca de segunda mano: ${SITE_URL}`
)}`;

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
  const [copyMessage, setCopyMessage] = useState("");

  const copySiteLink = async () => {
    try {
      await copyListingLink(SITE_URL);
      setCopyMessage("Enlace copiado");
    } catch {
      setCopyMessage("No se pudo copiar");
    }
  };

  const socialButtonClass =
    "tap-feedback inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-black transition";

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
          <div className="mt-5 grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center md:justify-start">
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir Instagram de Faralaes"
              title="Instagram de Faralaes"
              className={`${socialButtonClass} border-pink-200 bg-pink-50 text-pink-900 hover:border-pink-700`}
            >
              <SocialIcon name="instagram" />
              Instagram
            </a>
            <a
              href={whatsappFooterUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartir Faralaes por WhatsApp"
              title="Compartir por WhatsApp"
              className={`${socialButtonClass} border-green-200 bg-green-50 text-green-900 hover:border-green-700`}
            >
              <SocialIcon name="whatsapp" />
              WhatsApp
            </a>
            <button
              type="button"
              onClick={() => window.open(getFacebookShareUrl(SITE_URL))}
              aria-label="Compartir Faralaes en Facebook"
              title="Compartir en Facebook"
              className={`${socialButtonClass} border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-700`}
            >
              <SocialIcon name="facebook" />
              Facebook
            </button>
            <button
              type="button"
              onClick={copySiteLink}
              aria-label="Copiar enlace de Faralaes"
              title="Copiar enlace"
              className={`${socialButtonClass} border-stone-300 bg-white text-stone-800 hover:border-green-700 hover:text-green-800`}
            >
              <SocialIcon name="copy" />
              Copiar
            </button>
          </div>
          {copyMessage ? (
            <p className="mt-2 text-sm font-semibold text-green-800" role="status">
              {copyMessage}
            </p>
          ) : null}
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
