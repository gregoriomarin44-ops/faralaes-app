export const OPERATION_TYPES = ["sale", "donation"] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];

export const normalizeOperationType = (
  value: unknown
): OperationType =>
  value === "donation" ? "donation" : "sale";

export const isDonationListing = (operationType: unknown) =>
  normalizeOperationType(operationType) === "donation";

export const getOperationLabel = (operationType: unknown) =>
  isDonationListing(operationType) ? "Gratis / donación" : "Venta";
