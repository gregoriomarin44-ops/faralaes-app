import type { MouseEvent } from "react";
import { formatPrice } from "../lib/formatPrice";
import { getConditionLabel } from "../lib/listingOptions";

export type ListingCardItem = {
  id: string;
  sellerId?: string;
  title: string;
  description?: string | null;
  priceCents: number;
  location?: string | null;
  size?: string | null;
  color?: string | null;
  brand?: string | null;
  condition?: string | null;
  shippingAvailable?: boolean;
  whatsappContactAllowed?: boolean;
  sellerVerified?: boolean;
  sellerFeatured?: boolean;
  images?: {
    url: string;
  }[];
};

type ListingCardProps = {
  listing: ListingCardItem;
  isFavorite?: boolean;
  isOwnListing?: boolean;
  onClick: () => void;
  onFavoriteClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

const ShippingIcon = () => (
  <svg
    aria-hidden="true"
    className="h-3.5 w-3.5"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M3 7h11v10H3z" />
    <path d="M14 11h4l3 3v3h-7z" />
    <path d="M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="M17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
  </svg>
);

const WhatsappIcon = () => (
  <svg
    aria-hidden="true"
    className="h-3.5 w-3.5"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" />
    <path d="M9 9.5c.5 2 2 3.5 4 4l1.2-1.2" />
  </svg>
);

export default function ListingCard({
  listing,
  isFavorite = false,
  isOwnListing = false,
  onClick,
  onFavoriteClick,
}: ListingCardProps) {
  const imageCount = listing.images?.length || 0;
  const profileBadge = listing.sellerFeatured
    ? "Perfil top"
    : listing.sellerVerified
      ? "Verificado"
      : "";

  return (
    <article
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_6px_18px_rgba(34,24,20,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_16px_34px_rgba(34,24,20,0.12)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        {listing.images?.[0]?.url ? (
          <img
            src={listing.images[0].url}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-stone-400">
            Sin imagen
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-950/45 via-stone-950/10 to-transparent" />

        {(profileBadge || isOwnListing) && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-900 shadow-sm backdrop-blur">
            {isOwnListing ? "Tu anuncio" : profileBadge}
          </span>
        )}

        {onFavoriteClick && (
          <button
            type="button"
            onClick={onFavoriteClick}
            className="tap-feedback absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-2xl leading-none shadow-sm backdrop-blur transition hover:scale-105"
            aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
          >
            <span className={isFavorite ? "text-red-700" : "text-stone-500"}>
              ♥
            </span>
          </button>
        )}

        {imageCount > 1 && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-stone-950/70 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur">
            1/{imageCount}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[1.35rem] font-black leading-none tracking-normal text-red-800">
          {formatPrice(listing.priceCents)}
        </p>

        <h2 className="mt-2 line-clamp-2 min-h-[2.5rem] text-[15px] font-bold leading-5 text-stone-950">
          {listing.title}
        </h2>

        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-stone-600">
          {listing.size && (
            <span className="rounded-full bg-[#f8f3ef] px-2 py-0.5">
              Talla {listing.size}
            </span>
          )}
          {listing.color && (
            <span className="rounded-full bg-[#f8f3ef] px-2 py-0.5">
              {listing.color}
            </span>
          )}
          {listing.brand && (
            <span className="max-w-full truncate rounded-full bg-[#f8f3ef] px-2 py-0.5">
              {listing.brand}
            </span>
          )}
          {listing.condition && (
            <span className="rounded-full bg-[#f8f3ef] px-2 py-0.5">
              {getConditionLabel(listing.condition)}
            </span>
          )}
        </div>

        <div className="mt-auto flex min-h-7 items-center justify-between gap-2 pt-3 text-xs text-stone-500">
          <p className="min-w-0 truncate font-medium">
            {listing.location || "Andalucía"}
          </p>
          <div className="flex shrink-0 items-center gap-1.5 text-stone-600">
            {listing.shippingAvailable && (
              <span title="Envío disponible" aria-label="Envío disponible">
                <ShippingIcon />
              </span>
            )}
            {listing.whatsappContactAllowed && (
              <span title="WhatsApp permitido" aria-label="WhatsApp permitido">
                <WhatsappIcon />
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
