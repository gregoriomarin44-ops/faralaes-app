import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";

type Producto = {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  priceCents: number;
  category: string;
  size: string | null;
  color: string | null;
  location: string | null;
  condition: string | null;
  shippingAvailable: boolean;
};

export default function EditarProducto() {
  const router = useRouter();
  const { id } = router.query;

  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("traje");
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estado, setEstado] = useState("muy_bueno");
  const [envioDisponible, setEnvioDisponible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
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
        if (producto.sellerId !== userId) {
          throw new Error("No puedes editar un anuncio de otro usuario.");
        }

        setTitulo(producto.title);
        setPrecio(String(producto.priceCents / 100));
        setDescripcion(producto.description || "");
        setCategoria(producto.category);
        setTalla(producto.size || "");
        setColor(producto.color || "");
        setUbicacion(producto.location || "");
        setEstado(producto.condition || "muy_bueno");
        setEnvioDisponible(producto.shippingAvailable);
        setError("");
      })
      .catch((err: Error) => {
        setError(err.message || "No se ha podido cargar el anuncio.");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const guardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
      return;
    }

    if (!id || typeof id !== "string") {
      setError("Producto no encontrado.");
      return;
    }

    setSaving(true);
    setMensaje("");
    setError("");

    const res = await fetch("/api/productos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        userId,
        title: titulo,
        description: descripcion,
        priceCents: Math.round(Number(precio) * 100),
        category: categoria,
        size: talla || null,
        color: color || null,
        location: ubicacion || null,
        condition: estado,
        shippingAvailable: envioDisponible,
      }),
    });

    if (res.ok) {
      setMensaje("Anuncio actualizado correctamente.");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || "No se ha podido guardar el anuncio.");
    }

    setSaving(false);
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
                type="number"
                step="0.01"
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
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="traje">Traje</option>
                <option value="zapatos">Zapatos</option>
                <option value="mantoncillo">Mantoncillo</option>
                <option value="complementos">Complementos</option>
              </select>
              <input
                className="w-full rounded border p-3"
                value={talla}
                onChange={(e) => setTalla(e.target.value)}
                placeholder="Talla"
              />
              <input
                className="w-full rounded border p-3"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Color"
              />
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
                <option value="nuevo">Nuevo</option>
                <option value="muy_bueno">Muy bueno</option>
                <option value="bueno">Bueno</option>
                <option value="usado">Usado</option>
              </select>
              <label className="flex items-center gap-3 rounded border p-3 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={envioDisponible}
                  onChange={(e) => setEnvioDisponible(e.target.checked)}
                />
                Envío disponible
              </label>

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
