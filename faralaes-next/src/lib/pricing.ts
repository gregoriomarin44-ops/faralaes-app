export const hasDiscount = (
  priceCents?: number | null,
  previousPriceCents?: number | null
) =>
  typeof priceCents === "number" &&
  typeof previousPriceCents === "number" &&
  Number.isFinite(priceCents) &&
  Number.isFinite(previousPriceCents) &&
  priceCents > 0 &&
  previousPriceCents > priceCents;

export const getDiscountPercent = (
  priceCents?: number | null,
  previousPriceCents?: number | null
) => {
  if (!hasDiscount(priceCents, previousPriceCents)) {
    return null;
  }

  return Math.round(((previousPriceCents! - priceCents!) / previousPriceCents!) * 100);
};

