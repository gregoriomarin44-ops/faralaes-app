import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import { getAbsoluteImageUrl, getCanonical } from "../../lib/seo";
import { prisma } from "../../lib/prisma";

type BlogListPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
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
      coverImageUrl: true,
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
        <section className="border-b border-stone-200 bg-white px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <nav className="flex gap-2 text-sm font-semibold text-stone-500">
              <Link href="/" className="transition hover:text-red-800">
                Inicio
              </Link>
              <span>/</span>
              <span className="text-stone-900">Blog</span>
            </nav>
            <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-red-700">
              Blog Faralaes
            </p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-tight text-stone-950 sm:text-6xl">
              Guia viva de moda flamenca y segunda mano
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
              Ideas para comprar mejor, vender con claridad y preparar feria o
              romeria con piezas flamencas que merecen seguir bailando.
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
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {posts.length === 0 ? (
            <div className="rounded-lg border border-stone-200 bg-white p-8 text-center shadow-sm">
              <h2 className="font-serif text-3xl text-stone-950">
                Todavia no hay articulos publicados
              </h2>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-stone-600">
                Vuelve pronto para leer guias sobre trajes de flamenca,
                complementos, ferias y compraventa de segunda mano.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {post.coverImageUrl ? (
                    <img
                      src={post.coverImageUrl}
                      alt=""
                      className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-stone-950 via-red-950 to-green-900 font-serif text-5xl text-white">
                      F
                    </div>
                  )}
                  <article className="p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-red-700">
                      {formatDate(post.publishedAt)}
                    </p>
                    <h2 className="mt-3 font-serif text-2xl leading-tight text-stone-950">
                      {post.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                      {post.excerpt}
                    </p>
                    <span className="mt-5 inline-flex text-sm font-black text-green-800">
                      Leer articulo
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
