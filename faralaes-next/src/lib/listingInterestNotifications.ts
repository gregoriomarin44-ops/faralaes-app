import { getAppBaseUrl } from "./emailVerification";
import { escapeHtml } from "./mail";

export type ListingInterestEmailInput = {
  listingId: string;
  listingTitle: string;
  sellerEmail: string;
  views: number;
  favorites: number;
  req?: {
    headers?: {
      host?: string;
    };
  };
};

export const shouldNotifyListingInterest = ({
  views,
  favorites,
}: Pick<ListingInterestEmailInput, "views" | "favorites">) =>
  views >= 25 || favorites >= 3;

export const buildListingInterestEmail = ({
  listingId,
  listingTitle,
  views,
  favorites,
  req,
}: ListingInterestEmailInput) => {
  const baseUrl = getAppBaseUrl(req).replace(/\/$/, "");
  const listingUrl = `${baseUrl}/producto/${encodeURIComponent(listingId)}`;
  const safeListingTitle = escapeHtml(listingTitle);
  const safeListingUrl = escapeHtml(listingUrl);
  const interestLine =
    favorites > 0
      ? `${views} visitas y ${favorites} favoritos`
      : `${views} visitas`;

  return {
    subject: "Tu anuncio está recibiendo interés",
    text: [
      "Tu anuncio está recibiendo interés",
      "",
      `Anuncio: ${listingTitle}`,
      `Actividad: ${interestLine}`,
      "",
      "Ver anuncio:",
      listingUrl,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #241f1c;">
        <h2 style="margin: 0 0 16px;">Tu anuncio está recibiendo interés</h2>
        <p style="margin: 0 0 12px;"><strong>${safeListingTitle}</strong></p>
        <p style="margin: 0 0 18px;">Ya acumula ${escapeHtml(interestLine)} en Faralaes.</p>
        <p>
          <a href="${safeListingUrl}" style="display: inline-block; background: #15803d; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700;">
            Ver anuncio
          </a>
        </p>
      </div>
    `,
  };
};
