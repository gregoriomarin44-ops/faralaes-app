export const accountTypes = ["individual", "shop", "designer"] as const;

export type AccountType = (typeof accountTypes)[number];

export const accountTypeLabels: Record<AccountType, string> = {
  individual: "Particular",
  shop: "Tienda",
  designer: "Diseñador",
};

export const accountTypeDescriptions: Record<AccountType, string> = {
  individual: "Vendo moda flamenca propia",
  shop: "Vendo desde una tienda o negocio",
  designer: "Vendo mis propios diseños",
};

export const normalizeAccountType = (value: unknown): AccountType =>
  typeof value === "string" && accountTypes.includes(value as AccountType)
    ? (value as AccountType)
    : "individual";
