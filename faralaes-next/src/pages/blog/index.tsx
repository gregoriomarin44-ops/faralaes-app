import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import { buildSeoPath, getAbsoluteImageUrl, getCanonical } from "../../lib/seo";
import { prisma } from "../../lib/prisma";

type BlogListPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  publishedAt: string;
};

type BlogIndexProps = {
  posts: BlogListPost[];
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

const getReadingMinutes = (content: string) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
};

const getPostsGridClass = (postCount: number) => {
  if (postCount === 1) {
    return "mx-auto grid w-full max-w-[520px] grid-cols-1 gap-6";
  }

  if (postCount === 2) {
    return "mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2";
  }

  return "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";
};

const heroChips = [
  { href: buildSeoPath({ categorySlug: "trajes-flamenca" }), label: "Trajes de flamenca" },
  { href: "/catalogo?q=segunda%20mano", label: "Segunda mano" },
  { href: "/catalogo?q=feria", label: "Ferias" },
  { href: buildSeoPath({ categorySlug: "moda-rociera" }), label: "Moda rociera" },
  { href: "/catalogo?q=dise%C3%B1adora", label: "Diseñadoras" },
  { href: buildSeoPath({ categorySlug: "mantoncillos" }), label: "Mantoncillos" },
];

const popularTopics = [
  {
    href: "/catalogo?categoria=traje",
    icon: "T",
    label: "Trajes de flamenca",
    text: "Vestidos, volantes y piezas principales para feria o evento.",
  },
  {
    href: "/catalogo?categoria=moda_rociera",
    icon: "R",
    label: "Moda rociera",
    text: "Prendas cómodas, romería y piezas listas para el camino.",
  },
  {
    href: "/catalogo?categoria=complementos",
    icon: "C",
    label: "Complementos",
    text: "Flores, pendientes, bolsos y detalles que cambian el conjunto.",
  },
  {
    href: "/catalogo?categoria=mantoncillos",
    icon: "M",
    label: "Mantoncillos",
    text: "Color, textura y movimiento para rematar el look flamenco.",
  },
  {
    href: "/catalogo?categoria=nina",
    icon: "N",
    label: "Niña",
    text: "Moda flamenca infantil para feria, fiestas y celebraciones.",
  },
  {
    href: "/catalogo?categoria=bolsos",
    icon: "B",
    label: "Bolsos",
    text: "Bolsos flamencos y piezas pequeñas para completar el conjunto.",
  },
];

export const getServerSideProps: GetServerSideProps<BlogIndexProps> = async () => {
  const posts = await prisma.blogPost.findMany({
    where: {
      status: "published",
      publishedAt: { not: null },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImageUrl: true,
      coverImageAlt: true,
      publishedAt: true,
    },
  });

  return {
    props: {
      posts: posts.map((post) => ({
        ...post,
        publishedAt: (post.publishedAt || new Date()).toISOString(),
      })),
    },
  };
};

export default function BlogIndex({ posts }: BlogIndexProps) {
  const canonical = getCanonical("/blog");
  const title = "Blog de moda flamenca, feria y segunda mano | Faralaes";
  const description =
    "Guias de compra y venta, tendencias de moda flamenca, feria, romerias y consejos para dar nueva vida a trajes y complementos.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={getAbsoluteImageUrl(null)} />
      </Head>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] text-stone-950">
        <section className="border-b border-stone-200 bg-white px-4 py-7 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-6xl">
            <nav className="flex gap-2 text-sm font-semibold text-stone-500">
              <Link href="/" className="transition hover:text-red-800">
                Inicio
              </Link>
              <span>/</span>
              <span className="text-stone-900">Blog</span>
            </nav>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-red-700">
              Blog Faralaes
            </p>
            <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
              Guia viva de moda flamenca y segunda mano
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700 sm:text-lg">
              Ideas para comprar mejor, vender con claridad y preparar feria o
              romeria con piezas flamencas que merecen seguir bailando.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/catalogo"
                className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-green-800"
              >
                Ver catalogo
              </Link>
              <Link
                href="/publicar"
                className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-black text-stone-800 transition hover:border-red-800 hover:text-red-800"
              >
                Publicar anuncio
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {heroChips.map((chip) => (
                <Link
                  key={chip.href}
                  href={chip.href}
                  className="rounded-full border border-stone-200 bg-[#f8f3ef] px-3.5 py-2 text-sm font-bold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:bg-white hover:text-red-800"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-red-700">
                Editorial Faralaes
              </p>
              <h2 className="mt-2 font-serif text-4xl text-stone-950">
                Ultimos articulos
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="w-fit rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-black text-stone-700 transition hover:border-green-700 hover:text-green-800"
            >
              Explorar marketplace
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="p-7 sm:p-9">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
                    Proximamente
                  </p>
                  <h3 className="mt-3 font-serif text-4xl leading-tight text-stone-950">
                    Estamos preparando guias para comprar y vender moda flamenca
                  </h3>
                  <p className="mt-4 max-w-2xl leading-7 text-stone-600">
                    Mientras llegan los primeros articulos, puedes explorar
                    anuncios activos de trajes de flamenca, mantoncillos,
                    complementos y moda rociera de segunda mano.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link
                      href="/catalogo"
                      className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-green-800"
                    >
                      Ver catalogo
                    </Link>
                    <Link
                      href="/publicar"
                      className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-black text-stone-800 transition hover:border-red-800 hover:text-red-800"
                    >
                      Publicar anuncio
                    </Link>
                  </div>
                </div>
                <div className="min-h-64 bg-gradient-to-br from-stone-950 via-red-950 to-green-900 p-6 text-white">
                  <div className="grid h-full content-end gap-3">
                    <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide">
                      Marketplace activo
                    </span>
                    <p className="max-w-sm font-serif text-3xl leading-tight">
                      Moda flamenca con fotos, precio y piezas listas para otra feria.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={getPostsGridClass(posts.length)}>
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group w-full overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_18px_45px_rgba(34,24,20,0.13)]"
                >
                  <div className="overflow-hidden bg-stone-200">
                    {post.coverImageUrl ? (
                      <img
                        src={post.coverImageUrl}
                        alt={post.coverImageAlt || post.title}
                        className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-stone-950 via-red-950 to-green-900 font-serif text-6xl text-white">
                        F
                      </div>
                    )}
                  </div>
                  <article className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-stone-500">
                      <span className="text-red-700">
                        {formatDate(post.publishedAt)}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-stone-300" />
                      <span>{getReadingMinutes(post.content)} min lectura</span>
                    </div>
                    <h3 className="mt-3 font-serif text-2xl leading-tight text-stone-950">
                      {post.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-base leading-7 text-stone-600">
                      {post.excerpt}
                    </p>
                    <span className="mt-5 inline-flex text-sm font-black text-green-800 transition group-hover:text-red-800">
                      Leer articulo
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="border-y border-stone-200 bg-white px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-red-700">
                Navega por interes
              </p>
              <h2 className="mt-2 font-serif text-4xl text-stone-950">
                Temas populares
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popularTopics.map((topic) => (
                <Link
                  key={topic.href}
                  href={topic.href}
                  className="group rounded-lg border border-stone-200 bg-[#f8f3ef] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-800 hover:bg-white hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-900 font-serif text-lg text-white transition group-hover:bg-green-700">
                      {topic.icon}
                    </span>
                    <div>
                      <h3 className="font-bold text-stone-950">{topic.label}</h3>
                      <p className="mt-1 text-sm leading-6 text-stone-600">
                        {topic.text}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-lg bg-red-950 px-6 py-9 text-white shadow-[0_22px_55px_rgba(69,10,10,0.22)] sm:px-9">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-red-100">
                  Vende en Faralaes
                </p>
                <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
                  ¿Tienes moda flamenca guardada en el armario?
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-white/85">
                  Publica gratis tus trajes, mantones y complementos en Faralaes.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/publicar"
                  className="rounded-full bg-green-700 px-6 py-3 text-center text-sm font-black text-white shadow-sm transition hover:bg-green-800"
                >
                  Publicar anuncio
                </Link>
                <Link
                  href="/catalogo"
                  className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-center text-sm font-black text-white transition hover:bg-white hover:text-red-950"
                >
                  Ver catalogo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
