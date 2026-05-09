export const categoryOptions = [
  { value: "traje", label: "Trajes" },
  { value: "zapatos", label: "Zapatos" },
  { value: "complementos", label: "Complementos" },
  { value: "mantoncillo", label: "Mantoncillos" },
  { value: "nina", label: "Niña" },
  { value: "hombre", label: "Hombre" },
  { value: "flores", label: "Flores" },
  { value: "pendientes", label: "Pendientes" },
  { value: "peinetas", label: "Peinetas" },
  { value: "bolsos", label: "Bolsos" },
  { value: "moda_rociera", label: "Moda rociera" },
] as const;

export const usageOptions = [
  { value: "feria", label: "Feria" },
  { value: "rocio", label: "Rocío" },
  { value: "romeria", label: "Romería" },
  { value: "flamenco_escenario", label: "Flamenco escenario" },
  { value: "ensayo", label: "Ensayo" },
  { value: "invitada", label: "Invitada" },
] as const;

export const conditionOptions = [
  { value: "nuevo", label: "Nuevo" },
  { value: "muy_bueno", label: "Muy bueno" },
  { value: "bueno", label: "Bueno" },
  { value: "usado", label: "Usado" },
] as const;

export const getCategoryLabel = (value: string | null | undefined) =>
  categoryOptions.find((option) => option.value === value)?.label ||
  value ||
  "Sin categoría";

export const getUsageLabel = (value: string | null | undefined) =>
  usageOptions.find((option) => option.value === value)?.label ||
  value ||
  "No indicado";

export const getConditionLabel = (value: string | null | undefined) =>
  conditionOptions.find((option) => option.value === value)?.label ||
  value ||
  "No indicado";
