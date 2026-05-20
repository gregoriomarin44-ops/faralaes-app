import { useEffect, useState } from "react";
import SocialIcon from "./SocialIcon";
import {
  copyListingLink,
  getFacebookShareUrl,
  INSTAGRAM_PROFILE_URL,
  getListingPublicUrl,
  getWhatsappShareUrl,
  shareListingNative,
  type ShareableListing,
} from "../lib/listingShare";

type ListingShareActionsProps = {
  listing: ShareableListing;
  className?: string;
  compact?: boolean;
  showNative?: boolean;
};

const buttonBase =
  "tap-feedback inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition sm:min-h-10 sm:py-2";

export default function ListingShareActions({
  listing,
  className = "",
  compact = false,
  showNative = true,
}: ListingShareActionsProps) {
  const [message, setMessage] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const url = getListingPublicUrl(listing.id);

  useEffect(() => {
    setCanNativeShare(Boolean(navigator.share));
  }, []);

  const copy = async () => {
    try {
      await copyListingLink(url);
      setMessage("Enlace copiado");
    } catch {
      setMessage("No se pudo copiar");
    }
  };

  const nativeShare = async () => {
    try {
      const shared = await shareListingNative(listing, url);

      if (!shared) {
        await copy();
      }
    } catch {
      setMessage("No se pudo compartir");
    }
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {showNative && canNativeShare ? (
          <button
            type="button"
            onClick={nativeShare}
            aria-label="Compartir anuncio"
            title="Compartir anuncio"
            className={`${buttonBase} border-green-700 bg-green-700 text-white hover:bg-green-800 ${
              compact ? "px-3 text-xs" : ""
            }`}
          >
            <SocialIcon name="share" />
            Compartir
          </button>
        ) : null}
        <button
          type="button"
          onClick={() =>
            window.open(
              getWhatsappShareUrl(listing, url),
              "_blank",
              "noopener,noreferrer"
            )
          }
          aria-label="Compartir anuncio por WhatsApp"
          title="Compartir por WhatsApp"
          className={`${buttonBase} border-green-200 bg-green-50 text-green-900 hover:border-green-700 ${
            compact ? "px-3 text-xs" : ""
          }`}
        >
          <SocialIcon name="whatsapp" />
          {compact ? "WhatsApp" : "Compartir por WhatsApp"}
        </button>
        <button
          type="button"
          onClick={() => window.open(getFacebookShareUrl(url))}
          aria-label="Compartir anuncio en Facebook"
          title="Compartir en Facebook"
          className={`${buttonBase} border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-700 ${
            compact ? "px-3 text-xs" : ""
          }`}
        >
          <SocialIcon name="facebook" />
          Facebook
        </button>
        <a
          href={INSTAGRAM_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir Instagram de Faralaes"
          title="Instagram de Faralaes"
          className={`${buttonBase} border-pink-200 bg-pink-50 text-pink-900 hover:border-pink-700 ${
            compact ? "px-3 text-xs" : ""
          }`}
        >
          <SocialIcon name="instagram" />
          Instagram
        </a>
        <button
          type="button"
          onClick={copy}
          aria-label="Copiar enlace del anuncio"
          title="Copiar enlace"
          className={`${buttonBase} border-stone-300 bg-white text-stone-800 hover:border-green-700 hover:text-green-800 ${
            compact ? "px-3 text-xs" : ""
          }`}
        >
          <SocialIcon name="copy" />
          Copiar enlace
        </button>
      </div>
      {message ? (
        <p className="mt-2 text-sm font-semibold text-green-800" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
