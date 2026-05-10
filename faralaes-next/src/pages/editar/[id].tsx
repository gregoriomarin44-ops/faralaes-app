import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { useAuth } from "../../lib/authContext";
import {
  categoryOptions,
  conditionOptions,
  getCategoryAttributeSchema,
  normalizeAttributesForCategory,
  usageOptions,
} from "../../lib/listingOptions";

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

const centimosAPrecio = (centimos: number) =>
  (centimos / 100).toFixed(2).replace(".", ",");

type Producto = {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  priceCents: number;
  category: string;
  size: string | null;
  color: string | null;
  brand: string | null;
  usage: string | null;
  location: string | null;
  condition: string | null;
  attributes: Record<string, string | number | boolean> | null;
  shippingAvailable: boolean;
  whatsappContactAllowed: boolean;
  images?: {
    url: string;
  }[];
};

export default function EditarProducto() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { id } = router.query;

  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("traje");
  const [attributes, setAttributes] = useState<Record<string, string | boolean>>({});
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [marca, setMarca] = useState("");
  const [uso, setUso] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estado, setEstado] = useState("muy_bueno");
  const [envioDisponible, setEnvioDisponible] = useState(false);
  const [contactoWhatsapp, setContactoWhatsapp] = useState(false);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [imagenesCambiadas, setImagenesCambiadas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || authLoading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (!id || typeof id !== "string") {
      setError("Producto no encontrado.");
      setLoading(false);
      return;
    }

    fetch(`/api/productos/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se ha podido cargar el anuncio.");
        }

        return res.json();
      })
      .then((producto: Producto) => {
        if (producto.sellerId !== user.id) {
          throw new Error("No puedes editar un anuncio de otro usuario.");
        }

        setTitulo(producto.title);
        setPrecio(centimosAPrecio(producto.priceCents));
        setDescripcion(producto.description || "");
        setCategoria(producto.category);
        setAttributes(
          normalizeAttributesForCategory(producto.category, producto.attributes) as Record<
            string,
            string | boolean
          >
        );
        setTalla(producto.size || "");
        setColor(producto.color || "");
        setMarca(producto.brand || "");
        setUso(producto.usage || "");
        setUbicacion(producto.location || "");
        setEstado(producto.condition || "muy_bueno");
        setEnvioDisponible(producto.shippingAvailable);
        setContactoWhatsapp(producto.whatsappContactAllowed);
        setImagenes(producto.images?.map((image) => image.url) || []);
        setImagenesCambiadas(false);
        setError("");
        return null;
      })
      .catch((err: Error) => {
        setError(err.message || "No se ha podido cargar el anuncio.");
      })
      .finally(() => setLoading(false));
  }, [authLoading, id, router, router.asPath, router.isReady, user]);

  const guardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!id || typeof id !== "string") {
      setError("Producto no encontrado.");
      return;
    }

    setSaving(true);
    setMensaje("");
    setError("");

    const priceCents = precioAcentimos(precio);

    if (priceCents === null) {
      setError("Introduce un precio válido. Ejemplo: 90,50");
      setSaving(false);
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
      setError(`Completa el campo "${missingAttribute.label}".`);
      setSaving(false);
      return;
    }

    const res = await fetch("/api/productos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        title: titulo,
        description: descripcion,
        priceCents,
        category: categoria,
        size: talla || null,
        color: color || null,
        brand: marca || null,
        usage: uso || null,
        location: ubicacion || null,
        condition: estado,
        attributes,
        shippingAvailable: envioDisponible,
        whatsappContactAllowed: contactoWhatsapp,
        ...(imagenesCambiadas ? { images: imagenes } : {}),
      }),
    });

    if (res.ok) {
      setMensaje("Anuncio actualizado correctamente.");
    } else if (res.status === 401) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || "No se ha podido guardar el anuncio.");
    }

    setSaving(false);
  };

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
      setError("Puedes subir un máximo de 5 imágenes.");
      return;
    }

    const imagenGrande = seleccionadas.find((file) => file.size > MAX_IMAGE_SIZE);

    if (imagenGrande) {
      setError(`La imagen "${imagenGrande.name}" supera el máximo de 2MB.`);
      return;
    }

    setError("");

    try {
      const nuevasImagenes = await Promise.all(
        seleccionadas.map((file) => convertirImagenABase64(file))
      );
      setImagenes(nuevasImagenes);
      setImagenesCambiadas(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se han podido leer las imágenes seleccionadas."
      );
    }
  };

  const updateAttribute = (key: string, value: string | boolean) => {
    setAttributes((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const renderAttributeFields = () => {
    const schema = getCategoryAttributeSchema(categoria);

    if (!categoria || schema.length === 0) {
      return null;
    }

    return (
      <fieldset className="space-y-3 rounded-xl border border-gray-200 bg-[#f8f3ef] p-4">
        <legend className="px-1 text-sm font-bold text-gray-800">
          Características de {categoryOptions.find((option) => option.value === categoria)?.label.toLowerCase()}
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
        <section className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
            Editar anuncio
          </p>
          <h1 className="mb-6 mt-3 font-serif text-4xl">
            Actualizar producto
          </h1>

          {loading && <p>Cargando anuncio...</p>}

          {!loading && error && <p className="text-red-700">{error}</p>}

          {!loading && !error && (
            <form onSubmit={guardar} className="space-y-4">
              <input
                className="w-full rounded border p-3"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título"
                required
              />
              <input
                className="w-full rounded border p-3"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Precio"
                type="text"
                inputMode="decimal"
                required
              />
              <textarea
                className="w-full rounded border p-3"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción"
              />
              <select
                className="w-full rounded border p-3"
                value={categoria}
                onChange={(e) => {
                  setCategoria(e.target.value);
                  setAttributes({});
                }}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {renderAttributeFields()}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  className="w-full rounded border p-3"
                  value={talla}
                  onChange={(e) => setTalla(e.target.value)}
                  placeholder="Talla, ej. 38, M"
                  maxLength={20}
                />
                <input
                  className="w-full rounded border p-3"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Color"
                  maxLength={40}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  className="w-full rounded border p-3"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Marca o diseñador"
                  maxLength={80}
                />
                <select
                  className="w-full rounded border p-3"
                  value={uso}
                  onChange={(e) => setUso(e.target.value)}
                >
                  <option value="">Tipo de uso</option>
                  {usageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="w-full rounded border p-3"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ubicación"
              />
              <select
                className="w-full rounded border p-3"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                {conditionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-3 rounded border p-3 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={envioDisponible}
                  onChange={(e) => setEnvioDisponible(e.target.checked)}
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
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    seleccionarImagenes(e.target.files);
                    e.target.value = "";
                  }}
                />

                {imagenes.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {imagenes.map((imagen, index) => (
                      <div
                        key={`${imagen.slice(0, 40)}-${index}`}
                        className="relative aspect-square overflow-hidden rounded border border-gray-200 bg-gray-100"
                      >
                        <img
                          src={imagen}
                          alt={`Imagen ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {imagenesCambiadas && (
                          <button
                            type="button"
                            onClick={() =>
                              setImagenes((prev) =>
                                prev.filter(
                                  (_, imageIndex) => imageIndex !== index
                                )
                              )
                            }
                            className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-red-700 shadow"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="w-full rounded bg-green-700 p-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                type="submit"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/mis-anuncios")}
                className="w-full rounded border border-gray-300 bg-white p-3 font-semibold text-gray-700 transition hover:border-green-700 hover:text-green-700"
              >
                Volver a mis anuncios
              </button>
            </form>
          )}

          {mensaje && <p className="mt-4 text-green-700">{mensaje}</p>}
        </section>
      </main>
    </>
  );
}
