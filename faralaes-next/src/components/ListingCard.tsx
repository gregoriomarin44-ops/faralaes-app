import type { MouseEvent } from "react";
import { formatPrice } from "../lib/formatPrice";
import { getConditionLabel } from "../lib/listingOptions";
import { getOperationLabel, isDonationListing } from "../lib/listingOperation";
import UserAvatar from "./UserAvatar";

export type ListingCardItem = {
  id: string;
  sellerId?: string;
  title: string;
  description?: string | null;
  priceCents: number;
  operationType?: string | null;
  location?: string | null;
  size?: string | null;
  color?: string | null;
  brand?: string | null;
  condition?: string | null;
  shippingAvailable?: boolean;
  whatsappContactAllowed?: boolean;
  sellerVerified?: boolean;
  sellerFeatured?: boolean;
  listingFeatured?: boolean;
  sellerRatingAverage?: number | null;
  sellerReviewCount?: number;
  seller?: {
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
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
  onMessageClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onDetailsClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

const ShippingIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
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
    className="h-4 w-4"
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
  onMessageClick,
  onDetailsClick,
}: ListingCardProps) {
  const imageCount = listing.images?.length || 0;
  const isDonation = isDonationListing(listing.operationType);
  const ratingAverage =
    typeof listing.sellerRatingAverage === "number" &&
    Number.isFinite(listing.sellerRatingAverage)
      ? listing.sellerRatingAverage
      : null;
  const reviewCount =
    typeof listing.sellerReviewCount === "number" &&
    Number.isFinite(listing.sellerReviewCount)
      ? listing.sellerReviewCount
      : 0;
  const profileBadge = listing.listingFeatured
    ? "Anuncio destacado"
    : listing.sellerFeatured
    ? "Vendedora destacada"
    : listing.sellerVerified
      ? "Verificado"
      : "";
  const chips = [
    listing.size ? `Talla ${listing.size}` : "",
    listing.color || "",
    listing.brand || "",
    listing.condition ? getConditionLabel(listing.condition) : "",
  ].filter(Boolean).slice(0, 3);
  const sellerName =
    listing.seller?.displayName?.trim() ||
    listing.seller?.username?.trim() ||
    "";

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

        {ratingAverage !== null && reviewCount > 0 ? (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-stone-900 shadow-sm backdrop-blur">
            ⭐ {ratingAverage.toFixed(1)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-3.5 py-3">
        {isDonation ? (
          <p className="inline-flex w-fit rounded-full bg-green-50 px-3 py-1 text-[13px] font-black uppercase tracking-wide text-green-800">
            {getOperationLabel(listing.operationType)}
          </p>
        ) : (
          <p className="text-[1.4rem] font-black leading-none tracking-normal text-red-800">
            {formatPrice(listing.priceCents)}
          </p>
        )}

        <h2 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-5 text-stone-950">
          {listing.title}
        </h2>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-stone-700">
          {listing.shippingAvailable && (
            <span className="inline-flex items-center gap-1 text-green-800">
              <ShippingIcon />
              Envío disponible
            </span>
          )}
          {listing.whatsappContactAllowed && (
            <span className="inline-flex items-center gap-1 text-green-800">
              <WhatsappIcon />
              WhatsApp
            </span>
          )}
        </div>

        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-stone-600">
            {chips.map((chip) => (
              <span
                key={chip}
                className="max-w-full truncate rounded-full bg-[#f8f3ef] px-2 py-0.5"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 text-xs text-stone-500">
          <p className="min-w-0 truncate font-medium">
            {listing.location || "Andalucía"}
          </p>
        </div>

        {sellerName && (
          <div className="mt-3 flex min-w-0 items-center gap-2 border-t border-stone-100 pt-3">
            <UserAvatar
              user={{
                displayName: listing.seller?.displayName,
                username: listing.seller?.username,
                avatarUrl: listing.seller?.avatarUrl,
              }}
              size="xs"
              expandable
              imageAlt={sellerName}
            />
            <p className="min-w-0 truncate text-xs font-bold text-stone-600">
              {sellerName}
            </p>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onMessageClick}
            className="tap-feedback h-9 rounded-full bg-green-700 px-3 text-xs font-black text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={!onMessageClick}
          >
            Mensaje
          </button>
          <button
            type="button"
            onClick={onDetailsClick || ((event) => {
              event.stopPropagation();
              onClick();
            })}
            className="tap-feedback h-9 rounded-full border border-stone-300 bg-white px-3 text-xs font-black text-stone-700 transition hover:border-green-700 hover:text-green-700"
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  );
}
