import Link from "next/link";
import NavBar from "../components/NavBar";

const sections = [
  {
    title: "Cómo vender",
    intro:
      "Publicar una prenda en Faralaes está pensado para ser rápido, claro y cómodo.",
    points: [
      "Haz fotos con buena luz: frontal, espalda, detalles, etiqueta y posibles marcas de uso.",
      "Indica talla, estado, color, ubicación y precio con sinceridad.",
      "Explica si aceptas envío o prefieres entrega en mano.",
      "Responde desde mensajes o WhatsApp solo cuando te sientas cómoda con la operación.",
    ],
  },
  {
    title: "Cómo comprar",
    intro:
      "Antes de decidirte por un traje, mantoncillo o complemento, revisa bien la información.",
    points: [
      "Lee la descripción completa y compara medidas si la talla puede variar.",
      "Pide fotos adicionales si necesitas ver bajo, mangas, costuras o desgaste.",
      "Pregunta por forma de pago, envío y condiciones antes de cerrar la compra.",
      "Guarda tus favoritos para comparar opciones con calma.",
    ],
  },
  {
    title: "Consejos de seguridad",
    intro:
      "La moda flamenca se compra mejor con confianza. Estos hábitos ayudan a evitar sustos.",
    points: [
      "Desconfía de precios demasiado bajos para prendas de mucho valor.",
      "No compartas contraseñas, códigos de verificación ni datos bancarios fuera de canales seguros.",
      "Si quedas en persona, hazlo en lugares públicos y con tiempo para revisar la prenda.",
      "Evita pagos urgentes si la otra persona presiona o cambia las condiciones.",
    ],
  },
  {
    title: "Qué hacer si ves un anuncio sospechoso",
    intro:
      "Si algo no encaja, avísanos. Las señales pequeñas también ayudan a cuidar la comunidad.",
    points: [
      "Abre el anuncio y pulsa Reportar anuncio.",
      "Elige el motivo: spam, fraude, contenido inapropiado, artículo falso u otro.",
      "Añade detalles si ayudan a entender el problema.",
      "El equipo de administración revisará el aviso y podrá ocultar el anuncio si procede.",
    ],
  },
];

export default function ComoFunciona() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
              Guía Faralaes
            </p>
            <h1 className="mt-3 font-serif text-4xl text-gray-950 md:text-5xl">
              Cómo funciona Faralaes
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              Una guía sencilla para vender, comprar y moverte con seguridad en
              un marketplace pensado para trajes, vestidos y complementos de
              moda flamenca.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/publicar"
                className="rounded-full bg-green-700 px-6 py-3 text-center font-bold text-white transition hover:bg-green-800"
              >
                Publicar anuncio
              </Link>
              <Link
                href="/catalogo"
                className="rounded-full border border-gray-300 bg-white px-6 py-3 text-center font-bold text-gray-700 transition hover:border-green-700 hover:text-green-700"
              >
                Ver catálogo
              </Link>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h2 className="font-serif text-3xl text-gray-950">
                  {section.title}
                </h2>
                <p className="mt-3 leading-7 text-gray-600">{section.intro}</p>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-gray-700">
                  {section.points.map((point) => (
                    <li
                      key={point}
                      className="rounded-lg border border-gray-100 bg-[#f8f3ef] px-4 py-3"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
