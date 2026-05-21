import type { MouseEvent } from "react";
import { useState } from "react";
import AccountBadges from "./AccountBadges";
import QuickResponseBadge from "./QuickResponseBadge";
import UserActivityBadge from "./UserActivityBadge";
import { formatPrice } from "../lib/formatPrice";
import { getConditionLabel } from "../lib/listingOptions";
import { getOperationLabel, isDonationListing } from "../lib/listingOperation";
import {
  copyListingLink,
  getFacebookShareUrl,
  getListingPublicUrl,
  getWhatsappShareUrl,
  openShareWindow,
  shareListingNative,
} from "../lib/listingShare";
import SocialIcon from "./SocialIcon";
import UserAvatar from "./UserAvatar";

export type ListingCardItem = {
  id: string;
  sellerId?: string;
  title: string;
  description?: string | null;
  priceCents: number;
  operationType?: string | null;
  status?: string | null;
  createdAt?: string | Date | null;
  location?: string | null;
  size?: string | null;
  color?: string | null;
  brand?: string | null;
  condition?: string | null;
  shippingAvailable?: boolean;
  whatsappContactAllowed?: boolean;
  sellerVerified?: boolean;
  sellerFeatured?: boolean;
  sellerActiveListingCount?: number;
  listingFeatured?: boolean;
  sellerRatingAverage?: number | null;
  sellerReviewCount?: number;
  sellerRespondsQuickly?: boolean;
  views?: number | null;
  _count?: {
    favorites?: number;
    conversations?: number;
  };
  seller?: {
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
    accountType?: string | null;
    verified?: boolean | null;
    lastSeenAt?: string | null;
    respondsQuickly?: boolean | null;
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
  onSellerClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

type BadgeTone = "light" | "green" | "red" | "amber" | "dark";

type ListingBadge = {
  label: string;
  tone: BadgeTone;
};

const badgeToneClasses: Record<BadgeTone, string> = {
  light: "border-white/70 bg-white/90 text-stone-800",
  green: "border-green-100 bg-green-50 text-green-800",
  red: "border-red-100 bg-red-50 text-red-800",
  amber: "border-amber-100 bg-amber-50 text-amber-800",
  dark: "border-white/10 bg-stone-950/72 text-white",
};

const Badge = ({ label, tone }: ListingBadge) => (
  <span
    className={`inline-flex h-7 max-w-full items-center rounded-full border px-2.5 text-[11px] font-black uppercase tracking-wide shadow-sm backdrop-blur ${badgeToneClasses[tone]}`}
  >
    <span className="truncate">{label}</span>
  </span>
);

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

const MessageIcon = () => (
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
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
  </svg>
);

const EyeIcon = () => (
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
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
  </svg>
);

const HeartIcon = () => (
  <svg
    aria-hidden="true"
    className="h-3.5 w-3.5"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 21s-7.5-4.7-9.6-9.1C.7 8.4 2.6 4.5 6.3 4.1c2-.2 3.7.8 4.7 2.2 1-1.4 2.7-2.4 4.7-2.2 3.7.4 5.6 4.3 3.9 7.8C19.5 16.3 12 21 12 21Z" />
  </svg>
);

const MetricEyeIcon = () => (
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
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
  </svg>
);

const formatMetricCount = (value: number) =>
  new Intl.NumberFormat("es-ES").format(value);

const getRelativeDate = (value: ListingCardItem["createdAt"]) => {
  if (!value) {
    return "";
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const hours = Math.max(1, Math.floor((Date.now() - timestamp) / 3600000));

  if (hours < 24) {
    return `hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `hace ${days} d`;
  }

  const months = Math.floor(days / 30);

  return `hace ${months} mes${months === 1 ? "" : "es"}`;
};

const getBadges = ({
  isDonation,
  listing,
  ratingAverage,
}: {
  isDonation: boolean;
  listing: ListingCardItem;
  ratingAverage: number | null;
}) => {
  const badges: ListingBadge[] = [];
  const status = listing.status?.toLowerCase();
  const createdAt = listing.createdAt ? new Date(listing.createdAt).getTime() : NaN;
  const isNew =
    Number.isFinite(createdAt) && Date.now() - createdAt < 1000 * 60 * 60 * 24 * 7;

  if (status === "sold") {
    badges.push({ label: "Vendido", tone: "dark" });
  } else if (status === "reserved") {
    badges.push({ label: "Reservado", tone: "amber" });
  } else if (isDonation) {
    badges.push({ label: "Donación", tone: "green" });
  } else if (isNew) {
    badges.push({ label: "Nuevo", tone: "red" });
  }

  if (ratingAverage !== null && ratingAverage >= 4.8) {
    badges.push({ label: "5 estrellas", tone: "light" });
  }

  if (listing.shippingAvailable) {
    badges.push({ label: "Envío", tone: "light" });
  }

  if (listing.sellerVerified) {
    badges.push({ label: "Verificado", tone: "green" });
  }

  if (listing.listingFeatured || listing.sellerFeatured) {
    badges.push({
      label: listing.listingFeatured ? "Destacado" : "Tienda destacada",
      tone: "dark",
    });
  }

  return badges.slice(0, 3);
};

export default function ListingCard({
  listing,
  isFavorite = false,
  isOwnListing = false,
  onClick,
  onFavoriteClick,
  onMessageClick,
  onDetailsClick,
  onSellerClick,
}: ListingCardProps) {
  const imageCount = listing.images?.length || 0;
  const primaryImage = listing.images?.[0]?.url || "";
  const isDonation = isDonationListing(listing.operationType);
  const relativeDate = getRelativeDate(listing.createdAt);
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
  const badges = getBadges({ isDonation, listing, ratingAverage });
  const sellerName =
    listing.seller?.displayName?.trim() ||
    listing.seller?.username?.trim() ||
    "";
  const chips = [
    listing.size ? `Talla ${listing.size}` : "",
    listing.color || "",
    listing.brand || "",
    listing.condition ? getConditionLabel(listing.condition) : "",
  ].filter(Boolean).slice(0, 2);
  const viewCount =
    typeof listing.views === "number" && Number.isFinite(listing.views)
      ? listing.views
      : 0;
  const favoriteCount =
    typeof listing._count?.favorites === "number" &&
    Number.isFinite(listing._count.favorites)
      ? listing._count.favorites
      : 0;
  const cardMetrics = [
    viewCount >= 10
      ? {
          key: "views",
          label: `${formatMetricCount(viewCount)} visitas`,
          icon: <MetricEyeIcon />,
        }
      : null,
    favoriteCount > 0
      ? {
          key: "favorites",
          label:
            favoriteCount === 1
              ? "1 favorito"
              : `${formatMetricCount(favoriteCount)} favoritos`,
          icon: <HeartIcon />,
        }
      : null,
  ].filter(
    (metric): metric is { key: string; label: string; icon: JSX.Element } =>
      Boolean(metric)
  );
  const [shareMessage, setShareMessage] = useState("");

  const handleCopyLink = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await copyListingLink(getListingPublicUrl(listing.id));
      setShareMessage("Enlace copiado");
    } catch {
      setShareMessage("No se pudo copiar");
    }
  };

  const handleShare = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const url = getListingPublicUrl(listing.id);

    try {
      const shared = await shareListingNative(listing, url);

      if (!shared) {
        await copyListingLink(url);
        setShareMessage("Enlace copiado");
      }
    } catch {
      setShareMessage("No se pudo compartir");
    }
  };

  const handleWhatsappShare = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    openShareWindow(getWhatsappShareUrl(listing, getListingPublicUrl(listing.id)));
  };

  const handleFacebookShare = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    window.open(getFacebookShareUrl(getListingPublicUrl(listing.id)));
  };

  return (
    <article
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_24px_rgba(34,24,20,0.07)] transition duration-200 hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_20px_42px_rgba(34,24,20,0.14)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={listing.title}
            loading="lazy"
            className="motion-image h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.035]"
          />
        ) : (
          <div className="skeleton flex h-full w-full items-center justify-center">
            <span className="relative z-10 font-serif text-4xl text-stone-300">
              Faralaes
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-stone-950/45 via-stone-950/12 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-stone-950/58 via-stone-950/16 to-transparent" />

        <div className="absolute left-2.5 top-2.5 flex max-w-[calc(100%-5rem)] flex-wrap gap-1.5">
          {isOwnListing ? <Badge label="Tu anuncio" tone="light" /> : null}
          {badges.map((badge) => (
            <Badge key={`${badge.label}-${badge.tone}`} {...badge} />
          ))}
        </div>

        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          {onFavoriteClick && (
            <button
              type="button"
              onClick={onFavoriteClick}
              className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-xl leading-none shadow-sm backdrop-blur transition hover:scale-105"
              aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
            >
              <span className={isFavorite ? "text-red-700" : "text-stone-500"}>
                ♥
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105 hover:text-green-700"
            aria-label="Compartir anuncio"
            title="Compartir anuncio"
          >
            <SocialIcon name="share" />
          </button>
        </div>

        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2">
          {imageCount > 1 ? (
            <span className="rounded-full bg-stone-950/75 px-2.5 py-1 text-[11px] font-black text-white shadow-sm backdrop-blur">
              1/{imageCount}
            </span>
          ) : (
            <span />
          )}

          {ratingAverage !== null && reviewCount > 0 ? (
            <span className="rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-black text-stone-900 shadow-sm backdrop-blur">
              {ratingAverage.toFixed(1)} estrellas
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3.5 py-3.5">
        <div className="flex items-start justify-between gap-2">
          {isDonation ? (
            <p className="inline-flex w-fit rounded-full bg-green-50 px-3 py-1 text-[13px] font-black uppercase tracking-wide text-green-800">
              {getOperationLabel(listing.operationType)}
            </p>
          ) : (
            <p className="text-[1.55rem] font-black leading-none tracking-normal text-red-800">
              {formatPrice(listing.priceCents)}
            </p>
          )}
          {relativeDate && (
            <p className="shrink-0 pt-1 text-[11px] font-bold uppercase tracking-wide text-stone-400">
              {relativeDate}
            </p>
          )}
        </div>

        <h2 className="mt-2 line-clamp-2 min-h-10 text-[15px] font-black leading-5 text-stone-950">
          {listing.title}
        </h2>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs font-semibold text-stone-500">
          <p className="min-w-0 truncate">
            {listing.location || "Andalucía"}
          </p>
          {listing.shippingAvailable && (
            <span className="inline-flex shrink-0 items-center gap-1 text-green-800">
              <ShippingIcon />
              Envío
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

        {sellerName && (
          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
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
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSellerClick?.(event);
              }}
              disabled={!onSellerClick}
              className="min-w-[7rem] flex-1 text-left disabled:cursor-default"
              aria-label={`Ver perfil de ${sellerName}`}
            >
              <span className="block truncate text-xs font-black text-stone-700 transition group-hover:text-stone-900">
                {sellerName}
              </span>
              <span className="block truncate text-[11px] font-semibold text-stone-500">
                {ratingAverage !== null && reviewCount > 0
                  ? `${ratingAverage.toFixed(1)} estrellas · ${reviewCount} reseñas`
                  : listing.sellerActiveListingCount
                    ? `${listing.sellerActiveListingCount} anuncios activos`
                    : "Perfil Faralaes"}
              </span>
            </button>
            <AccountBadges user={listing.seller} compact />
            <QuickResponseBadge
              show={listing.seller?.respondsQuickly || listing.sellerRespondsQuickly}
              compact
            />
            <UserActivityBadge user={listing.seller} compact />
          </div>
        )}

        {cardMetrics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-stone-500">
            {cardMetrics.map((metric) => (
              <span
                key={metric.key}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f8f3ef] px-2.5 py-1"
              >
                {metric.icon}
                {metric.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3">
          <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-1.5">
            <button
              type="button"
              onClick={onMessageClick}
              className="tap-feedback inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-green-700 px-3 text-xs font-black text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              disabled={!onMessageClick}
            >
              <MessageIcon />
              Mensaje
            </button>
            <button
              type="button"
              onClick={onDetailsClick || ((event) => {
                event.stopPropagation();
                onClick();
              })}
              className="tap-feedback inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 text-xs font-black text-stone-700 transition hover:border-green-700 hover:text-green-700"
            >
              <EyeIcon />
              Ver
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="tap-feedback hidden h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-600 transition hover:border-green-700 hover:text-green-700 sm:inline-flex"
              aria-label="Copiar enlace"
              title="Copiar enlace"
            >
              <SocialIcon name="copy" />
            </button>
            <button
              type="button"
              onClick={handleWhatsappShare}
              className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-green-800 transition hover:border-green-700"
              aria-label="Compartir por WhatsApp"
              title="Compartir por WhatsApp"
            >
              <SocialIcon name="whatsapp" />
            </button>
            <button
              type="button"
              onClick={handleFacebookShare}
              className="tap-feedback hidden h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-blue-800 transition hover:border-blue-700 sm:inline-flex"
              aria-label="Compartir en Facebook"
              title="Compartir en Facebook"
            >
              <SocialIcon name="facebook" />
            </button>
          </div>
          {shareMessage ? (
            <p className="mt-2 text-xs font-bold text-green-800" role="status">
              {shareMessage}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
