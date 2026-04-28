export const formatEuroFromCents = (priceCents: number) =>
  new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(priceCents / 100);

export const getDiscountPercent = (originalPriceCents: number | null | undefined, priceCents: number) => {
  if (!originalPriceCents || originalPriceCents <= priceCents) return null;

  return Math.round(((originalPriceCents - priceCents) / originalPriceCents) * 100);
};

export const getRelativeTime = (date: string | null | undefined) => {
  if (!date) return null;

  const diffMs = Date.now() - new Date(date).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return null;

  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} hora${hours === 1 ? "" : "s"}`;

  const days = Math.floor(hours / 24);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
};

export const wasEditedAfterPublished = (publishedAt: string | null | undefined, updatedAt: string | null | undefined) => {
  if (!publishedAt || !updatedAt) return false;

  return new Date(updatedAt).getTime() - new Date(publishedAt).getTime() > 60000;
};
