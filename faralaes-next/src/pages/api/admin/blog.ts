import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "../../../lib/adminAuth";
import { prisma } from "../../../lib/prisma";
import { normalizeSlugText } from "../../../lib/seo";

const BLOG_STATUS = ["draft", "published"] as const;
type BlogStatus = (typeof BLOG_STATUS)[number];

const blogPostSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverImageUrl: true,
  coverImageAlt: true,
  status: true,
  publishedAt: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  author: {
    select: {
      email: true,
      displayName: true,
      username: true,
    },
  },
} satisfies Prisma.BlogPostSelect;

const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const getNullableString = (value: unknown) => {
  const text = getString(value);
  return text || null;
};

const getBlogPostInput = (body: Record<string, unknown>) => {
  const title = getString(body.title);
  const slug = normalizeSlugText(getString(body.slug) || title);
  const excerpt = getString(body.excerpt);
  const content = getString(body.content);
  const coverImageUrl = getNullableString(body.coverImageUrl);
  const coverImageAlt = getNullableString(body.coverImageAlt);
  const seoTitle = getNullableString(body.seoTitle);
  const seoDescription = getNullableString(body.seoDescription);
  const requestedStatus = getString(body.status);
  const status = BLOG_STATUS.includes(requestedStatus as BlogStatus)
    ? (requestedStatus as BlogStatus)
    : "draft";

  return {
    coverImageAlt,
    coverImageUrl,
    content,
    excerpt,
    seoDescription,
    seoTitle,
    slug,
    status,
    title,
  };
};

const validatePostInput = (input: ReturnType<typeof getBlogPostInput>) => {
  if (!input.title) {
    return "El titulo es obligatorio.";
  }

  if (!input.slug) {
    return "El slug es obligatorio.";
  }

  if (!input.excerpt) {
    return "La entradilla es obligatoria.";
  }

  if (!input.content) {
    return "El contenido es obligatorio.";
  }

  return "";
};

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAdmin(req, res);

  if (!user) {
    return;
  }

  if (req.method === "GET") {
    const posts = await prisma.blogPost.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: blogPostSelect,
    });

    return res.status(200).json(posts);
  }

  if (req.method === "POST") {
    const input = getBlogPostInput(req.body as Record<string, unknown>);
    const validationError = validatePostInput(input);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    try {
      const post = await prisma.blogPost.create({
        data: {
          ...input,
          authorId: user.id,
          publishedAt: input.status === "published" ? new Date() : null,
        },
        select: blogPostSelect,
      });

      return res.status(201).json(post);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: "Ya existe un articulo con ese slug." });
      }

      throw error;
    }
  }

  if (req.method === "PATCH") {
    const { postId, action } = req.body as {
      postId?: unknown;
      action?: unknown;
    };

    if (typeof postId !== "string") {
      return res.status(400).json({ error: "Articulo no valido." });
    }

    if (action === "publish" || action === "unpublish") {
      const status = action === "publish" ? "published" : "draft";
      const post = await prisma.blogPost.update({
        where: { id: postId },
        data: {
          status,
          publishedAt: status === "published" ? new Date() : null,
        },
        select: blogPostSelect,
      });

      return res.status(200).json(post);
    }

    const input = getBlogPostInput(req.body as Record<string, unknown>);
    const validationError = validatePostInput(input);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    try {
      const current = await prisma.blogPost.findUnique({
        where: { id: postId },
        select: { status: true, publishedAt: true },
      });

      if (!current) {
        return res.status(404).json({ error: "Articulo no encontrado." });
      }

      const post = await prisma.blogPost.update({
        where: { id: postId },
        data: {
          ...input,
          publishedAt:
            input.status === "published"
              ? current.publishedAt || new Date()
              : null,
        },
        select: blogPostSelect,
      });

      return res.status(200).json(post);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: "Ya existe un articulo con ese slug." });
      }

      throw error;
    }
  }

  if (req.method === "DELETE") {
    const { postId } = req.body as { postId?: unknown };

    if (typeof postId !== "string") {
      return res.status(400).json({ error: "Articulo no valido." });
    }

    await prisma.blogPost.delete({ where: { id: postId } });

    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST, PATCH, DELETE");
  return res.status(405).json({ error: "Metodo no permitido." });
}
