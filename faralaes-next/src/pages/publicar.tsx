import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import ListingShareActions from "../components/ListingShareActions";
import NavBar from "../components/NavBar";
import { useAuth } from "../lib/authContext";
import {
  uploadListingImage,
  validateListingImageFile,
  type PendingListingImage,
} from "../lib/listingImages";
import {
  categoryOptions,
  conditionOptions,
  colorOptions,
  getCategoryAttributeSchema,
  isOtherColorValue,
  isOtherSizeValue,
  sizeOptions,
  usageOptions,
} from "../lib/listingOptions";

const MAX_IMAGES = 5;

const getFileSignature = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`;

const precioAcentimos = (valor: string) => {
  const normalizado = valor.trim().replace(",", ".");
  const numero = Number(normalizado);

  if (!Number.isFinite(numero)) {
    return null;
  }

  return Math.round(numero * 100);
};

const getStringAttribute = (
  attributes: Record<string, string | boolean>,
  keys: string[]
) => {
  for (const key of keys) {
    const value = attributes[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

export default function Publicar() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [operationType, setOperationType] = useState<"sale" | "donation">("sale");
  const [precio, setPrecio] = useState("");
  const [precioAnterior, setPrecioAnterior] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [attributes, setAttributes] = useState<Record<string, string | boolean>>({});
  const [talla, setTalla] = useState("");
  const [manualSize, setManualSize] = useState("");
  const [color, setColor] = useState("");
  const [manualColor, setManualColor] = useState("");
  const [marca, setMarca] = useState("");
  const [uso, setUso] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estado, setEstado] = useState("muy_bueno");
  const [shippingAvailable, setShippingAvailable] = useState(false);
  const [contactoWhatsapp, setContactoWhatsapp] = useState(false);
  const [imagenes, setImagenes] = useState<PendingListingImage[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [publishedListing, setPublishedListing] = useState<{
    id: string;
    title: string;
    priceCents: number;
    operationType?: string | null;
  } | null>(null);

  const schema = getCategoryAttributeSchema(categoria);
  const hasDynamicSizeField = schema.some((field) =>
    ["talla", "talla_edad", "numero"].includes(field.key)
  );
  const dynamicSizeField = schema.find((field) =>
    ["talla", "talla_edad", "numero"].includes(field.key)
  );
  const hasDynamicColorField = schema.some((field) => field.key === "color");

  useEffect(() => {
    if (!router.isReady || authLoading) {
      return;
    }

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
    }
  }, [authLoading, router, router.asPath, router.isReady, user]);

  const seleccionarImagenes = async (files: FileList | null) => {
    if (!files?.length) return;

    const seleccionadas = Array.from(files);
    const firmasActuales = new Set(
      imagenes.map((imagen) => getFileSignature(imagen.file))
    );
    const firmasNuevas = new Set<string>();
    const nuevasSeleccionadas = seleccionadas.filter((file) => {
      const signature = getFileSignature(file);

      if (firmasActuales.has(signature) || firmasNuevas.has(signature)) {
        return false;
      }

      firmasNuevas.add(signature);
      return true;
    });

    const huecosDisponibles = MAX_IMAGES - imagenes.length;

    if (nuevasSeleccionadas.length > huecosDisponibles) {
      setMensaje(
        `Puedes subir un máximo de ${MAX_IMAGES} imágenes. Ahora tienes ${imagenes.length} y has seleccionado ${nuevasSeleccionadas.length}.`
      );
      return;
    }

    if (nuevasSeleccionadas.length === 0) return;

    setMensaje("");
    setPublishedListing(null);

    try {
      await Promise.all(
        nuevasSeleccionadas.map((file) => validateListingImageFile(file))
      );
      const nuevasImagenes = nuevasSeleccionadas.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setImagenes((prev) => [...prev, ...nuevasImagenes]);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se han podido leer las imágenes seleccionadas."
      );
    }
  };

  const publicar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (!acceptedLegal) {
      setMensaje(
        "Debes aceptar la Política de privacidad y las Condiciones de uso."
      );
      return;
    }

    const priceCents = operationType === "donation" ? 0 : precioAcentimos(precio);
    const previousPriceCents =
      operationType === "donation" || !precioAnterior.trim()
        ? null
        : precioAcentimos(precioAnterior);

    if (operationType === "sale" && (priceCents === null || priceCents <= 0)) {
      setMensaje("Introduce un precio válido. Ejemplo: 90,50");
      return;
    }

    if (
      operationType === "sale" &&
      previousPriceCents !== null &&
      (previousPriceCents <= 0 || previousPriceCents <= (priceCents || 0))
    ) {
      setMensaje("El precio antes debe ser mayor que el precio actual.");
      return;
    }

    if (!categoria) {
      setMensaje("Elige una categoría para el anuncio.");
      return;
    }

    const selectedColor = getStringAttribute(attributes, ["color"]) || color;
    const trimmedManualColor = manualColor.trim();
    const selectedSize =
      getStringAttribute(attributes, ["talla", "talla_edad", "numero"]) || talla;
    const trimmedManualSize = manualSize.trim();

    if (isOtherSizeValue(selectedSize) && !trimmedManualSize) {
      setMensaje('Escribe la talla o elige una opción distinta de "Otra".');
      return;
    }

    if (isOtherColorValue(selectedColor) && !trimmedManualColor) {
      setMensaje('Escribe el color o elige una opción distinta de "Otro".');
      return;
    }

    const finalSize = isOtherSizeValue(selectedSize)
      ? trimmedManualSize
      : selectedSize.trim();
    const finalColor = isOtherColorValue(selectedColor)
      ? trimmedManualColor
      : selectedColor.trim();
    const submissionAttributes: Record<string, string | boolean> = {
      ...attributes,
      ...(dynamicSizeField && finalSize ? { [dynamicSizeField.key]: finalSize } : {}),
      ...(hasDynamicColorField && finalColor ? { color: finalColor } : {}),
    };

    const missingAttribute = getCategoryAttributeSchema(categoria).find(
      (field) =>
        field.required &&
        (submissionAttributes[field.key] === undefined ||
          submissionAttributes[field.key] === "" ||
          submissionAttributes[field.key] === false)
    );

    if (missingAttribute) {
      setMensaje(`Completa el campo "${missingAttribute.label}".`);
      return;
    }

    let res: Response;

    try {
      const uploadedImages = await Promise.all(
        imagenes.map((imagen) => uploadListingImage(imagen.file))
      );

      res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titulo,
          description: descripcion,
          priceCents,
          previousPriceCents,
          operationType,
          category: categoria,
          size: finalSize || null,
          color: finalColor || null,
          brand: marca || null,
          usage: uso || null,
          location: ubicacion || null,
          condition: estado,
          attributes: submissionAttributes,
          shippingAvailable,
          whatsappContactAllowed: contactoWhatsapp,
          images: uploadedImages,
        }),
      });
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se han podido subir las imágenes."
      );
      return;
    }

    if (res.ok) {
      const producto = await res.json();
      setMensaje("Anuncio publicado correctamente.");
      setPublishedListing({
        id: producto.id,
        title: producto.title,
        priceCents: producto.priceCents,
        operationType: producto.operationType,
      });
      setTitulo("");
      setOperationType("sale");
      setPrecio("");
      setPrecioAnterior("");
      setDescripcion("");
      setCategoria("");
      setAttributes({});
      setTalla("");
      setManualSize("");
      setColor("");
      setManualColor("");
      setMarca("");
      setUso("");
      setUbicacion("");
      setEstado("muy_bueno");
      setShippingAvailable(false);
      setContactoWhatsapp(false);
      imagenes.forEach((imagen) => URL.revokeObjectURL(imagen.previewUrl));
      setImagenes([]);
      setAcceptedLegal(false);
    } else if (res.status === 401) {
      setMensaje("Inicia sesion antes de publicar.");
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
    } else {
      setMensaje("Error al publicar.");
    }
  };

  const updateAttribute = (key: string, value: string | boolean) => {
    setAttributes((current) => ({
      ...current,
      [key]: value,
    }));

    if (key === "color" && typeof value === "string" && !isOtherColorValue(value)) {
      setManualColor("");
    }

    if (
      ["talla", "talla_edad", "numero"].includes(key) &&
      typeof value === "string" &&
      !isOtherSizeValue(value)
    ) {
      setManualSize("");
    }
  };

  const selectedCategoryLabel =
    categoryOptions.find((option) => option.value === categoria)?.label || "";

  const selectCategory = (value: string) => {
    setCategoria(value);
    setAttributes({});
    setColor("");
    setManualColor("");
    setTalla("");
    setManualSize("");
    setMensaje("");
    setPublishedListing(null);
  };

  const renderManualSizeInput = () => (
    <div className="mt-2 text-sm font-semibold text-gray-700">
      <span className="mb-1 block">Escribe la talla</span>
      <input
        className="w-full rounded border border-gray-300 bg-white p-3"
        value={manualSize}
        onChange={(e) => setManualSize(e.target.value)}
        placeholder="Ej: 58, XL, talla única, 3 años..."
        maxLength={40}
        required
      />
    </div>
  );

  const renderManualColorInput = () => (
    <div className="mt-2 text-sm font-semibold text-gray-700">
      <span className="mb-1 block">Escribe el color</span>
      <input
        className="w-full rounded border border-gray-300 bg-white p-3"
        value={manualColor}
        onChange={(e) => setManualColor(e.target.value)}
        placeholder="Ej: buganvilla, coral, verde agua..."
        maxLength={40}
        required
      />
    </div>
  );

  const renderAttributeFields = () => {
    if (!categoria || schema.length === 0) {
      return null;
    }

    return (
      <fieldset className="space-y-3 rounded-xl border border-gray-200 bg-[#f8f3ef] p-4">
        <legend className="px-1 text-sm font-bold text-gray-800">
          Características de {selectedCategoryLabel.toLowerCase()}
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {schema.map((field) => {
            const value = attributes[field.key];

            if (field.type === "boolean") {
              return (
                <label
                  key={field.key}
                  className="flex min-h-12 items-center gap-3 rounded border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={value === true}
                    onChange={(e) => updateAttribute(field.key, e.target.checked)}
                  />
                  {field.label}
                </label>
              );
            }

            if (field.type === "select") {
              const isColorField = field.key === "color";
              const isSizeField = ["talla", "talla_edad", "numero"].includes(
                field.key
              );

              return (
                <label key={field.key} className="block text-sm font-semibold text-gray-700">
                  <span className="mb-1 block">{field.label}</span>
                  <select
                    className="w-full rounded border border-gray-300 bg-white p-3"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => updateAttribute(field.key, e.target.value)}
                    required={field.required}
                  >
                    <option value="">No indicado</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {isColorField &&
                    typeof value === "string" &&
                    isOtherColorValue(value) &&
                    renderManualColorInput()}
                  {isSizeField &&
                    typeof value === "string" &&
                    isOtherSizeValue(value) &&
                    renderManualSizeInput()}
                </label>
              );
            }

            return (
              <label key={field.key} className="block text-sm font-semibold text-gray-700">
                <span className="mb-1 block">{field.label}</span>
                <input
                  className="w-full rounded border border-gray-300 bg-white p-3"
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) => updateAttribute(field.key, e.target.value)}
                  placeholder={field.label}
                  type={field.type === "number" ? "number" : "text"}
                  required={field.required}
                />
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="max-w-xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <h1 className="font-serif text-4xl mb-6">Publicar anuncio</h1>

          {authLoading && <p>Cargando sesion...</p>}

          {!authLoading && user && !categoria && (
            <div className="space-y-5">
              {publishedListing && (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
                  <p className="font-serif text-2xl text-gray-950">
                    Tu anuncio ya está publicado
                  </p>
                  <ListingShareActions
                    listing={publishedListing}
                    className="mt-4"
                    showNative={false}
                  />
                  <button
                    type="button"
                    onClick={() => router.push(`/producto/${publishedListing.id}`)}
                    className="tap-feedback mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-stone-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-950"
                  >
                    Ver anuncio
                  </button>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                  ¿Qué quieres anunciar?
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Elige el tipo de artículo para mostrar solo los campos que
                  necesita esa categoría.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectCategory(option.value)}
                    className="tap-feedback min-h-24 rounded-xl border border-gray-200 bg-[#f8f3ef] px-3 py-4 text-center font-bold text-gray-900 shadow-sm transition hover:border-green-700 hover:bg-white hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!authLoading && user && categoria && (
          <form onSubmit={publicar} className="space-y-4">
            <div className="rounded-xl border border-red-100 bg-[#f8f3ef] p-4">
              <p className="text-sm font-semibold text-gray-600">
                Estás anunciando:{" "}
                <span className="font-bold text-red-800">
                  {selectedCategoryLabel}
                </span>
              </p>
              <button
                type="button"
                onClick={() => selectCategory("")}
                className="mt-3 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-green-700 hover:text-green-700"
              >
                Cambiar tipo de artículo
              </button>
            </div>

            <label className="block text-sm font-semibold text-gray-700">
              <span className="mb-1 block">Tipo de anuncio</span>
              <select
                className="w-full rounded border border-gray-300 bg-white p-3"
                value={operationType}
                onChange={(e) => {
                  const nextType = e.target.value === "donation" ? "donation" : "sale";
                  setOperationType(nextType);
                  if (nextType === "donation") {
                    setPrecio("");
                    setPrecioAnterior("");
                  }
                }}
              >
                <option value="sale">Venta</option>
                <option value="donation">Regalo / donación</option>
              </select>
            </label>

            <input className="w-full border p-3 rounded" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" required />
            {operationType === "sale" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input className="w-full border p-3 rounded" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Precio" type="text" inputMode="decimal" required />
                <input className="w-full border p-3 rounded" value={precioAnterior} onChange={(e) => setPrecioAnterior(e.target.value)} placeholder="Precio antes (opcional)" type="text" inputMode="decimal" />
              </div>
            ) : (
              <p className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold leading-6 text-green-900">
                Indica en la descripción cómo prefieres entregarlo.
              </p>
            )}
            <textarea className="w-full border p-3 rounded" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />

            {renderAttributeFields()}

            {(!hasDynamicSizeField || !hasDynamicColorField) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {!hasDynamicSizeField && (
                  <label className="block text-sm font-semibold text-gray-700">
                    <span className="mb-1 block">Talla</span>
                    <select
                      className="w-full rounded border border-gray-300 bg-white p-3"
                      value={talla}
                      onChange={(e) => {
                        setTalla(e.target.value);
                        if (!isOtherSizeValue(e.target.value)) {
                          setManualSize("");
                        }
                      }}
                    >
                      <option value="">No indicado</option>
                      {sizeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {isOtherSizeValue(talla) && renderManualSizeInput()}
                  </label>
                )}
                {!hasDynamicColorField && (
                  <label className="block text-sm font-semibold text-gray-700">
                    <span className="mb-1 block">Color</span>
                    <select
                      className="w-full rounded border border-gray-300 bg-white p-3"
                      value={color}
                      onChange={(e) => {
                        setColor(e.target.value);
                        if (!isOtherColorValue(e.target.value)) {
                          setManualColor("");
                        }
                      }}
                    >
                      <option value="">No indicado</option>
                      {colorOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {isOtherColorValue(color) && renderManualColorInput()}
                  </label>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="w-full border p-3 rounded" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Marca o diseñador" maxLength={80} />
              <select className="w-full border p-3 rounded" value={uso} onChange={(e) => setUso(e.target.value)}>
                <option value="">Tipo de uso</option>
                {usageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <input className="w-full border p-3 rounded" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ubicación" />

            <select className="w-full border p-3 rounded" value={estado} onChange={(e) => setEstado(e.target.value)}>
              {conditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-3 rounded border p-3 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={shippingAvailable}
                onChange={(e) => setShippingAvailable(e.target.checked)}
              />
              Envío disponible
            </label>

            <label className="flex items-center gap-3 rounded border p-3 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={contactoWhatsapp}
                onChange={(e) => setContactoWhatsapp(e.target.checked)}
              />
              Permitir contacto por WhatsApp
            </label>

            <div className="space-y-3">
              <div className="rounded border border-gray-200 bg-white p-3">
                <input
                  id="listing-images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    seleccionarImagenes(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label
                    htmlFor="listing-images"
                    className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-[#f8f3ef] px-4 py-2 text-sm font-bold text-gray-800 transition hover:border-green-700 hover:text-green-700 sm:w-auto"
                  >
                    Elegir imágenes
                  </label>
                  <div className="text-sm text-gray-500 sm:text-right">
                    <p>
                      {imagenes.length === 0
                        ? "Ninguna imagen seleccionada"
                        : imagenes.length === 1
                          ? "1 imagen seleccionada"
                          : `${imagenes.length} imágenes seleccionadas`}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-gray-400">
                      Máx. {MAX_IMAGES} imágenes
                    </p>
                  </div>
                </div>
              </div>

              {imagenes.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {imagenes.map((imagen, index) => (
                    <div
                      key={`${imagen.previewUrl}-${index}`}
                      className="relative aspect-square min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                    >
                      <img
                        src={imagen.previewUrl}
                        alt={`Imagen ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(imagen.previewUrl);
                          setImagenes((prev) =>
                            prev.filter((_, imageIndex) => imageIndex !== index)
                          );
                        }}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold leading-none text-red-700 shadow"
                        aria-label={`Eliminar imagen ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-start gap-3 rounded border border-gray-200 bg-[#f8f3ef] p-3 text-sm leading-6 text-gray-700">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(e) => setAcceptedLegal(e.target.checked)}
                required
                className="mt-1"
              />
              <span>
                He leído y acepto la{" "}
                <Link
                  href="/privacidad"
                  className="font-semibold text-green-800 hover:text-green-900"
                >
                  Política de privacidad
                </Link>{" "}
                y las{" "}
                <Link
                  href="/condiciones"
                  className="font-semibold text-green-800 hover:text-green-900"
                >
                  Condiciones de uso
                </Link>
                .
              </span>
            </label>

            <button className="w-full bg-green-700 text-white p-3 rounded font-semibold" type="submit">
              Publicar
            </button>
          </form>
          )}

          {mensaje && <p className="mt-4">{mensaje}</p>}
        </section>
      </main>
    </>
  );
}
