import { useRouter } from "next/router";
import { useState } from "react";
import NavBar from "../components/NavBar";

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
  const [imagen, setImagen] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");

  const convertirImagen = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setImagen(reader.result as string);
    reader.readAsDataURL(file);
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
        image: imagen,
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
      setImagen(null);
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

            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) convertirImagen(file);
            }} />

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
