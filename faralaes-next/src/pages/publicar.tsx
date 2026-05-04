import { useRouter } from "next/router";
import { useState } from "react";
import NavBar from "../components/NavBar";

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

export default function Publicar() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("traje");
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estado, setEstado] = useState("muy_bueno");
  const [shippingAvailable, setShippingAvailable] = useState(false);
  const [contactoWhatsapp, setContactoWhatsapp] = useState(false);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");

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
      setMensaje("Puedes subir un máximo de 5 imágenes.");
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

    const userId = localStorage.getItem("userId");

    if (!userId) {
      setMensaje("Inicia sesion antes de publicar.");
      router.push("/login");
      return;
    }

    const priceCents = precioAcentimos(precio);

    if (priceCents === null) {
      setMensaje("Introduce un precio válido. Ejemplo: 90,50");
      return;
    }

    const res = await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerId: userId,
        title: titulo,
        description: descripcion,
        priceCents,
        category: categoria,
        size: talla || null,
        color: color || null,
        location: ubicacion || null,
        condition: estado,
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
      setCategoria("traje");
      setTalla("");
      setColor("");
      setUbicacion("");
      setEstado("muy_bueno");
      setShippingAvailable(false);
      setContactoWhatsapp(false);
      setImagenes([]);
    } else {
      setMensaje("Error al publicar.");
    }
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="max-w-xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <h1 className="font-serif text-4xl mb-6">Publicar anuncio</h1>

          <form onSubmit={publicar} className="space-y-4">
            <input className="w-full border p-3 rounded" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" required />
            <input className="w-full border p-3 rounded" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Precio" type="text" inputMode="decimal" required />
            <textarea className="w-full border p-3 rounded" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" />

            <select className="w-full border p-3 rounded" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="traje">Traje</option>
              <option value="zapatos">Zapatos</option>
              <option value="mantoncillo">Mantoncillo</option>
              <option value="complementos">Complementos</option>
            </select>

            <input className="w-full border p-3 rounded" value={talla} onChange={(e) => setTalla(e.target.value)} placeholder="Talla" />
            <input className="w-full border p-3 rounded" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color" />
            <input className="w-full border p-3 rounded" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ubicación" />

            <select className="w-full border p-3 rounded" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="nuevo">Nuevo</option>
              <option value="muy_bueno">Muy bueno</option>
              <option value="bueno">Bueno</option>
              <option value="usado">Usado</option>
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
                      <button
                        type="button"
                        onClick={() =>
                          setImagenes((prev) =>
                            prev.filter((_, imageIndex) => imageIndex !== index)
                          )
                        }
                        className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-red-700 shadow"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="w-full bg-green-700 text-white p-3 rounded font-semibold" type="submit">
              Publicar
            </button>
          </form>

          {mensaje && <p className="mt-4">{mensaje}</p>}
        </section>
      </main>
    </>
  );
}
