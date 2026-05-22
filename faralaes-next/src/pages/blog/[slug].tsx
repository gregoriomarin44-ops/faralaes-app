import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import {
  buildSeoPath,
  getAbsoluteImageUrl,
  getCanonical,
} from "../../lib/seo";
import { prisma } from "../../lib/prisma";

type BlogPostPage = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  publishedAt: string;
  updatedAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  author: {
    displayName: string;
    username: string;
  } | null;
};

type BlogPostProps = {
  post: BlogPostPage;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

const renderContent = (content: string) =>
  content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

export const getServerSideProps: GetServerSideProps<BlogPostProps> = async ({
  params,
}) => {
  const slug = typeof params?.slug === "string" ? params.slug : "";

  if (!slug) {
    return { notFound: true };
  }

  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: "published",
      publishedAt: { not: null },
    },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImageUrl: true,
      coverImageAlt: true,
      publishedAt: true,
      updatedAt: true,
      seoTitle: true,
      seoDescription: true,
      author: {
        select: {
          displayName: true,
          username: true,
        },
      },
    },
  });

  if (!post || !post.publishedAt) {
    return { notFound: true };
  }

  return {
    props: {
      post: {
        ...post,
        publishedAt: post.publishedAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      },
    },
  };
};

export default function BlogPost({ post }: BlogPostProps) {
  const canonical = getCanonical(`/blog/${post.slug}`);
  const title = post.seoTitle || `${post.title} | Faralaes`;
  const description = post.seoDescription || post.excerpt;
  const image = getAbsoluteImageUrl(post.coverImageUrl);
  const authorName =
    post.author?.displayName || post.author?.username || "Faralaes";
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    author: {
      "@type": "Person",
      name: authorName,
    },
    dateModified: post.updatedAt,
    datePublished: post.publishedAt,
    description,
    headline: post.title,
    image,
    mainEntityOfPage: canonical,
    publisher: {
      "@type": "Organization",
      name: "Faralaes",
      logo: {
        "@type": "ImageObject",
        url: getAbsoluteImageUrl(null),
      },
    },
  };
  const paragraphs = renderContent(post.content);
  const internalLinks = [
    { href: "/catalogo", label: "Catalogo de moda flamenca" },
    { href: buildSeoPath({ categorySlug: "trajes-flamenca" }), label: "Trajes de flamenca" },
    { href: buildSeoPath({ categorySlug: "complementos-flamencos" }), label: "Complementos flamencos" },
    { href: "/publicar", label: "Publicar anuncio" },
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={image} />
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:modified_time" content={post.updatedAt} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      </Head>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] text-stone-950">
        <article>
          <header className="border-b border-stone-200 bg-white px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-4xl">
              <nav className="flex flex-wrap gap-2 text-sm font-semibold text-stone-500">
                <Link href="/" className="transition hover:text-red-800">
                  Inicio
                </Link>
                <span>/</span>
                <Link href="/blog" className="transition hover:text-red-800">
                  Blog
                </Link>
                <span>/</span>
                <span className="text-stone-900">{post.title}</span>
              </nav>
              <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-red-700">
                {formatDate(post.publishedAt)}
              </p>
              <h1 className="mt-4 font-serif text-5xl leading-tight text-stone-950 sm:text-6xl">
                {post.title}
              </h1>
              <p className="mt-5 text-xl leading-9 text-stone-700">
                {post.excerpt}
              </p>
              <p className="mt-4 text-sm font-semibold text-stone-500">
                Por {authorName}
              </p>
            </div>
          </header>

          {post.coverImageUrl && (
            <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
              <img
                src={post.coverImageUrl}
                alt={post.coverImageAlt || post.title}
                className="aspect-[16/8] w-full rounded-lg object-cover shadow-sm"
              />
            </div>
          )}

          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="prose prose-stone max-w-none">
                {paragraphs.map((paragraph, index) => {
                  if (paragraph.startsWith("## ")) {
                    return (
                      <h2
                        key={index}
                        className="mt-8 font-serif text-3xl text-stone-950 first:mt-0"
                      >
                        {paragraph.replace(/^##\s+/, "")}
                      </h2>
                    );
                  }

                  return (
                    <p key={index} className="text-lg leading-8 text-stone-700">
                      {paragraph}
                    </p>
                  );
                })}
              </div>

              <div className="mt-10 rounded-lg bg-[#f8f3ef] p-6">
                <h2 className="font-serif text-3xl text-stone-950">
                  Encuentra o vende tu proximo look flamenco
                </h2>
                <p className="mt-3 leading-7 text-stone-700">
                  Explora anuncios reales de moda flamenca o publica tu traje,
                  mantoncillo, zapatos y complementos para que otra persona les
                  de nueva vida.
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
                    className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-black text-stone-800 transition hover:border-red-800 hover:text-red-800"
                  >
                    Publicar anuncio
                  </Link>
                </div>
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="font-serif text-2xl text-stone-950">
                  Seguir navegando
                </h2>
                <div className="mt-4 grid gap-2">
                  {internalLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-lg bg-[#f8f3ef] px-3 py-2 text-sm font-bold text-stone-700 transition hover:text-red-800"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </article>
      </main>
    </>
  );
}
