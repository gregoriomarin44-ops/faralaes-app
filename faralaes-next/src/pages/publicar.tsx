import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "../components/NavBar";
import { useAuth } from "../lib/authContext";
import {
  categoryOptions,
  conditionOptions,
  getCategoryAttributeSchema,
  usageOptions,
} from "../lib/listingOptions";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

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
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [attributes, setAttributes] = useState<Record<string, string | boolean>>({});
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [marca, setMarca] = useState("");
  const [uso, setUso] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estado, setEstado] = useState("muy_bueno");
  const [shippingAvailable, setShippingAvailable] = useState(false);
  const [contactoWhatsapp, setContactoWhatsapp] = useState(false);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const schema = getCategoryAttributeSchema(categoria);
  const hasDynamicSizeField = schema.some((field) =>
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

  const convertirImagenABase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("No se ha podido leer la imagen seleccionada."));
      };
      reader.onerror = () =>
        reject(new Error("No se ha podido leer la imagen seleccionada."));
      reader.readAsDataURL(file);
    });

  const seleccionarImagenes = async (files: FileList | null) => {
    if (!files?.length) return;

    const seleccionadas = Array.from(files);

    if (seleccionadas.length > MAX_IMAGES) {
      setMensaje(
        `Puedes subir un máximo de ${MAX_IMAGES} imágenes. Has seleccionado ${seleccionadas.length}.`
      );
      setImagenes([]);
      return;
    }

    const imagenGrande = seleccionadas.find((file) => file.size > MAX_IMAGE_SIZE);

    if (imagenGrande) {
      setMensaje(`La imagen "${imagenGrande.name}" supera el máximo de 2MB.`);
      setImagenes([]);
      return;
    }

    setMensaje("");

    try {
      const nuevasImagenes = await Promise.all(
        seleccionadas.map((file) => convertirImagenABase64(file))
      );
      setImagenes(nuevasImagenes);
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

    const priceCents = precioAcentimos(precio);

    if (priceCents === null) {
      setMensaje("Introduce un precio válido. Ejemplo: 90,50");
      return;
    }

    if (!categoria) {
      setMensaje("Elige una categoría para el anuncio.");
      return;
    }

    const missingAttribute = getCategoryAttributeSchema(categoria).find(
      (field) =>
        field.required &&
        (attributes[field.key] === undefined ||
          attributes[field.key] === "" ||
          attributes[field.key] === false)
    );

    if (missingAttribute) {
      setMensaje(`Completa el campo "${missingAttribute.label}".`);
      return;
    }

    const res = await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: titulo,
        description: descripcion,
        priceCents,
        category: categoria,
        size:
          getStringAttribute(attributes, ["talla", "talla_edad", "numero"]) ||
          talla ||
          null,
        color: getStringAttribute(attributes, ["color"]) || color || null,
        brand: marca || null,
        usage: uso || null,
        location: ubicacion || null,
        condition: estado,
        attributes,
        shippingAvailable,
        whatsappContactAllowed: contactoWhatsapp,
        images: imagenes,
      }),
    });

    if (res.ok) {
      setMensaje("Anuncio publicado correctamente.");
      setTitulo("");
      setPrecio("");
      setDescripcion("");
      setCategoria("");
      setAttributes({});
      setTalla("");
      setColor("");
      setMarca("");
      setUso("");
      setUbicacion("");
      setEstado("muy_bueno");
      setShippingAvailable(false);
      setContactoWhatsapp(false);
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
  };

  const selectedCategoryLabel =
    categoryOptions.find((option) => option.value === categoria)?.label || "";

  const selectCategory = (value: string) => {
    setCategoria(value);
    setAttributes({});
    setMensaje("");
  };

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

            <input className="w-full border p-3 rounded" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" required />
            <input className="w-full border p-3 rounded" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Precio" type="text" inputMode="decimal" required />
            <textarea className="w-full border p-3 rounded" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />

            {renderAttributeFields()}

            {(!hasDynamicSizeField || !hasDynamicColorField) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {!hasDynamicSizeField && (
                  <input className="w-full border p-3 rounded" value={talla} onChange={(e) => setTalla(e.target.value)} placeholder="Talla, ej. 38, M" maxLength={20} />
                )}
                {!hasDynamicColorField && (
                  <input className="w-full border p-3 rounded" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color" maxLength={40} />
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
                      key={`${imagen.slice(0, 40)}-${index}`}
                      className="relative aspect-square min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                    >
                      <img
                        src={imagen}
                        alt={`Imagen ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setImagenes((prev) =>
                            prev.filter((_, imageIndex) => imageIndex !== index)
                          )
                        }
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
