import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ProductoDetalle() {
  const router = useRouter();
  const { id } = router.query;

  const [producto, setProducto] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/productos/${id}`)
      .then((res) => res.json())
      .then((data) => setProducto(data));
  }, [id]);

  if (!producto) return <p>Cargando...</p>;

  return (
    <main style={{ maxWidth: 800, margin: "40px auto" }}>
      <h1>{producto.title}</h1>

      <p>{producto.description}</p>

      <h2>
        {(producto.priceCents / 100).toFixed(2)} €
      </h2>

      {producto.images?.[0]?.url && (
        <img
          src={producto.images[0].url}
          style={{ width: "300px" }}
        />
      )}
    </main>
  );
}