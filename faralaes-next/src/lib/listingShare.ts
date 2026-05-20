import { formatPrice } from "./formatPrice";
import { getAbsoluteUrl } from "./seo";
import { isDonationListing } from "./listingOperation";

export type ShareableListing = {
  id: string;
  title: string;
  priceCents?: number | null;
  operationType?: string | null;
};

export const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/faralaes.app/";

export const getListingPublicUrl = (listingId: string) => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/producto/${listingId}`;
  }

  return getAbsoluteUrl(`/producto/${listingId}`);
};

export const getListingShareTitle = (listing: ShareableListing) =>
  isDonationListing(listing.operationType)
    ? `${listing.title} gratis / donación | Faralaes`
    : `${listing.title} por ${formatPrice(listing.priceCents || 0)} | Faralaes`;

export const getListingShareText = (listing: ShareableListing) =>
  `Mira este anuncio en Faralaes: ${getListingShareTitle(listing)}`;

export const copyListingLink = async (url: string) => {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard unavailable");
  }

  await navigator.clipboard.writeText(url);
};

export const shareListingNative = async (listing: ShareableListing, url: string) => {
  if (!navigator.share) {
    return false;
  }

  await navigator.share({
    title: getListingShareTitle(listing),
    text: getListingShareText(listing),
    url,
  });

  return true;
};

export const openShareWindow = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export const getWhatsappShareUrl = (listing: ShareableListing, url: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${getListingShareText(listing)} ${url}`)}`;

export const getFacebookShareUrl = (url: string) =>
  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
