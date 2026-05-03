import { useState } from "react";

const SELLER_ID = "9b9f0f33-faf2-44ad-adbd-c2d8cbf2db2c";

export default function Publicar() {
  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [mensaje, setMensaje] = useState("");

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId: SELLER_ID }),
    });

    if (res.ok) {
      setMensaje("Anuncio publicado correctamente.");
      setTitulo("");
      setPrecio("");
      setDescripcion("");
    } else {
      setMensaje("Error al publicar.");
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Publicar anuncio</h1>

      <form onSubmit={publicar}>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" style={{ width: "100%", padding: 12, marginBottom: 12 }} />
        <input value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Precio" style={{ width: "100%", padding: 12, marginBottom: 12 }} />
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" style={{ width: "100%", padding: 12, marginBottom: 12 }} />

        <button type="submit" style={{ padding: 12 }}>
          Publicar
        </button>
      </form>

      {mensaje && <p>{mensaje}</p>}
    </main>
  );
}