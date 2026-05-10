export const categoryOptions = [
  { value: "traje", label: "Trajes" },
  { value: "zapatos", label: "Zapatos" },
  { value: "complementos", label: "Complementos" },
  { value: "abanicos", label: "Abanicos" },
  { value: "mantoncillo", label: "Mantoncillos" },
  { value: "nina", label: "Niña" },
  { value: "hombre", label: "Hombre" },
  { value: "flores", label: "Flores" },
  { value: "pendientes", label: "Pendientes" },
  { value: "peinetas", label: "Peinetas" },
  { value: "bolsos", label: "Bolsos" },
  { value: "moda_rociera", label: "Moda rociera" },
  { value: "otros", label: "Otros" },
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

const sizeOptions = [
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
  "50",
  "52",
  "Otra",
] as const;

const shoeSizeOptions = ["35", "36", "37", "38", "39", "40", "41", "42", "Otro"] as const;

const colorOptions = [
  "Rojo",
  "Negro",
  "Blanco",
  "Marfil",
  "Azul",
  "Verde",
  "Rosa",
  "Amarillo",
  "Morado",
  "Naranja",
  "Multicolor",
  "Otro",
] as const;

const detailedConditionOptions = [
  "Nuevo con etiqueta",
  "Nuevo sin etiqueta",
  "Muy buen estado",
  "Buen estado",
  "Con señales de uso",
  "Necesita arreglo",
] as const;

export type ListingAttributeField = {
  key: string;
  label: string;
  type: "select" | "text" | "number" | "boolean";
  options?: readonly string[];
  filterable: boolean;
  required: boolean;
};

export type ListingAttributes = Record<string, string | number | boolean>;

export const CATEGORY_ATTRIBUTE_SCHEMAS: Record<string, readonly ListingAttributeField[]> = {
  traje: [
    {
      key: "talla",
      label: "Talla",
      type: "select",
      options: sizeOptions,
      filterable: true,
      required: false,
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "disenador",
      label: "Diseñador",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "temporada",
      label: "Temporada",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "largo",
      label: "Largo",
      type: "select",
      options: ["Corto", "Media pierna", "Largo", "No lo sé"],
      filterable: true,
      required: false,
    },
    {
      key: "arreglos",
      label: "Tiene arreglos",
      type: "boolean",
      filterable: true,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
  zapatos: [
    {
      key: "numero",
      label: "Número",
      type: "select",
      options: shoeSizeOptions,
      filterable: true,
      required: false,
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "altura_tacon",
      label: "Altura de tacón",
      type: "select",
      options: ["Bajo", "Medio", "Alto", "No lo sé"],
      filterable: true,
      required: false,
    },
    {
      key: "marca",
      label: "Marca",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
  complementos: [
    {
      key: "tipo_complemento",
      label: "Tipo de complemento",
      type: "select",
      options: ["Flor", "Pendientes", "Peineta", "Broche", "Collar", "Bolso", "Otro"],
      filterable: true,
      required: false,
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "material",
      label: "Material",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "estilo",
      label: "Estilo",
      type: "select",
      options: ["Clásico", "Flamenco", "Rociero", "Moderno", "Otro"],
      filterable: true,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
  abanicos: [
    {
      key: "material",
      label: "Material",
      type: "select",
      options: ["Madera", "Tela", "Encaje", "Pericón", "Otro"],
      filterable: true,
      required: false,
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "tamano",
      label: "Tamaño",
      type: "select",
      options: ["Pequeño", "Mediano", "Grande", "No lo sé"],
      filterable: true,
      required: false,
    },
    {
      key: "pintado_a_mano",
      label: "Pintado a mano",
      type: "boolean",
      filterable: true,
      required: false,
    },
    {
      key: "incluye_funda",
      label: "Incluye funda",
      type: "boolean",
      filterable: true,
      required: false,
    },
  ],
  mantoncillo: [
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "tejido",
      label: "Tejido",
      type: "select",
      options: ["Seda", "Gasa", "Crespon", "Bordado", "Otro", "No lo sé"],
      filterable: true,
      required: false,
    },
    {
      key: "bordado",
      label: "Bordado",
      type: "boolean",
      filterable: true,
      required: false,
    },
    {
      key: "flecos",
      label: "Flecos",
      type: "select",
      options: ["Cortos", "Medios", "Largos", "Sin flecos"],
      filterable: true,
      required: false,
    },
    {
      key: "tamano",
      label: "Tamaño",
      type: "select",
      options: ["Pequeño", "Mediano", "Grande"],
      filterable: true,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
  moda_rociera: [
    {
      key: "tipo_prenda",
      label: "Tipo de prenda",
      type: "select",
      options: ["Falda", "Blusa", "Chaleco", "Camisa", "Pantalón", "Vestido", "Otro"],
      filterable: true,
      required: false,
    },
    {
      key: "talla",
      label: "Talla",
      type: "select",
      options: sizeOptions,
      filterable: true,
      required: false,
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "marca",
      label: "Marca",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "temporada",
      label: "Temporada",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
  nina: [
    {
      key: "tipo_prenda",
      label: "Tipo de prenda",
      type: "select",
      options: ["Traje", "Falda", "Zapatos", "Complemento", "Otro"],
      filterable: true,
      required: false,
    },
    {
      key: "talla_edad",
      label: "Talla/edad",
      type: "select",
      options: [
        "0-2 años",
        "3-4 años",
        "5-6 años",
        "7-8 años",
        "9-10 años",
        "11-12 años",
        "13-14 años",
        "Otra",
      ],
      filterable: true,
      required: false,
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "temporada",
      label: "Temporada",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
  hombre: [
    {
      key: "tipo_prenda",
      label: "Tipo de prenda",
      type: "select",
      options: [
        "Traje corto",
        "Chaqueta",
        "Camisa",
        "Pantalón",
        "Sombrero",
        "Botas",
        "Complemento",
        "Otro",
      ],
      filterable: true,
      required: false,
    },
    {
      key: "talla",
      label: "Talla",
      type: "select",
      options: ["XS", "S", "M", "L", "XL", "XXL", "Otra"],
      filterable: true,
      required: false,
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "marca",
      label: "Marca",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
  flores: [
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "material",
      label: "Material",
      type: "select",
      options: ["Tela", "Plástico", "Preservada", "Artificial", "Otro"],
      filterable: true,
      required: false,
    },
    {
      key: "tamano",
      label: "Tamaño",
      type: "select",
      options: ["Pequeña", "Mediana", "Grande"],
      filterable: true,
      required: false,
    },
    {
      key: "tipo_fijacion",
      label: "Tipo de fijación",
      type: "select",
      options: ["Pinza", "Horquilla", "Broche", "Otro"],
      filterable: true,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
  pendientes: [
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "material",
      label: "Material",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "tamano",
      label: "Tamaño",
      type: "select",
      options: ["Pequeños", "Medianos", "Grandes"],
      filterable: true,
      required: false,
    },
    {
      key: "cierre",
      label: "Cierre",
      type: "select",
      options: ["Presión", "Clip", "Gancho", "Otro"],
      filterable: true,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
  peinetas: [
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "material",
      label: "Material",
      type: "select",
      options: ["Acetato", "Carey sintético", "Metal", "Plástico", "Otro"],
      filterable: true,
      required: false,
    },
    {
      key: "tamano",
      label: "Tamaño",
      type: "select",
      options: ["Pequeña", "Mediana", "Grande"],
      filterable: true,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
  bolsos: [
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "material",
      label: "Material",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "tamano",
      label: "Tamaño",
      type: "select",
      options: ["Pequeño", "Mediano", "Grande"],
      filterable: true,
      required: false,
    },
    {
      key: "tipo",
      label: "Tipo",
      type: "select",
      options: ["Clutch", "Bandolera", "Bolso de mano", "Otro"],
      filterable: true,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
  otros: [
    {
      key: "tipo",
      label: "Tipo",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "color",
      label: "Color",
      type: "select",
      options: colorOptions,
      filterable: true,
      required: false,
    },
    {
      key: "material",
      label: "Material",
      type: "text",
      filterable: false,
      required: false,
    },
    {
      key: "estado_detalle",
      label: "Estado detallado",
      type: "select",
      options: detailedConditionOptions,
      filterable: true,
      required: false,
    },
  ],
};

export const getCategoryAttributeSchema = (category: string | null | undefined) =>
  category ? CATEGORY_ATTRIBUTE_SCHEMAS[category as keyof typeof CATEGORY_ATTRIBUTE_SCHEMAS] || [] : [];

export const normalizeAttributesForCategory = (
  category: string | null | undefined,
  input: unknown
): ListingAttributes => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const source = input as Record<string, unknown>;

  return getCategoryAttributeSchema(category).reduce<ListingAttributes>(
    (attributes, field) => {
      const value = source[field.key];

      if (field.type === "boolean") {
        if (value === true || value === "true") {
          attributes[field.key] = true;
        } else if (value === false || value === "false") {
          attributes[field.key] = false;
        }

        return attributes;
      }

      if (field.type === "number") {
        const numberValue =
          typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;

        if (Number.isFinite(numberValue)) {
          attributes[field.key] = numberValue;
        }

        return attributes;
      }

      if (typeof value !== "string") {
        return attributes;
      }

      const trimmed = value.trim();

      if (trimmed) {
        attributes[field.key] = trimmed;
      }

      return attributes;
    },
    {}
  );
};

export const getAttributeField = (
  category: string | null | undefined,
  key: string
) => getCategoryAttributeSchema(category).find((field) => field.key === key);

export const formatAttributeValue = (
  field: ListingAttributeField,
  value: string | number | boolean
) => {
  if (field.type === "boolean") {
    return value ? "Sí" : "No";
  }

  return String(value);
};

export const getDisplayAttributes = (
  category: string | null | undefined,
  attributes: unknown
) => {
  const normalizedAttributes = normalizeAttributesForCategory(category, attributes);

  return getCategoryAttributeSchema(category)
    .map((field) => {
      const value = normalizedAttributes[field.key];

      if (value === undefined || value === "") {
        return null;
      }

      return {
        key: field.key,
        label: field.label,
        value: formatAttributeValue(field, value),
      };
    })
    .filter((item): item is { key: string; label: string; value: string } =>
      Boolean(item)
    );
};

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
