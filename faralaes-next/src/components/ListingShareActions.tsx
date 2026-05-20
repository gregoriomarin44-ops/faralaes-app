import { useEffect, useState } from "react";
import {
  copyListingLink,
  getFacebookShareUrl,
  getListingPublicUrl,
  getWhatsappShareUrl,
  openShareWindow,
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
  "tap-feedback inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition";

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
      <div className="flex flex-wrap gap-2">
        {showNative && canNativeShare ? (
          <button
            type="button"
            onClick={nativeShare}
            className={`${buttonBase} border-green-700 bg-green-700 text-white hover:bg-green-800 ${
              compact ? "px-3 text-xs" : ""
            }`}
          >
            Compartir
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => openShareWindow(getWhatsappShareUrl(listing, url))}
          className={`${buttonBase} border-green-200 bg-green-50 text-green-900 hover:border-green-700 ${
            compact ? "px-3 text-xs" : ""
          }`}
        >
          {compact ? "WhatsApp" : "Compartir por WhatsApp"}
        </button>
        <button
          type="button"
          onClick={() => openShareWindow(getFacebookShareUrl(url))}
          className={`${buttonBase} border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-700 ${
            compact ? "px-3 text-xs" : ""
          }`}
        >
          Facebook
        </button>
        <button
          type="button"
          onClick={copy}
          className={`${buttonBase} border-stone-300 bg-white text-stone-800 hover:border-green-700 hover:text-green-800 ${
            compact ? "px-3 text-xs" : ""
          }`}
        >
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
