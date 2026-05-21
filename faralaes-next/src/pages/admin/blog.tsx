import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import AdminLayout, { useAdminSession } from "../../components/admin/AdminLayout";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    email: string;
    displayName: string;
    username: string;
  } | null;
};

type BlogForm = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  status: "draft" | "published";
  seoTitle: string;
  seoDescription: string;
};

const emptyForm: BlogForm = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
};

const normalizeSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Sin publicar";

const toForm = (post: BlogPost): BlogForm => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  coverImageUrl: post.coverImageUrl || "",
  status: post.status,
  seoTitle: post.seoTitle || "",
  seoDescription: post.seoDescription || "",
});

export default function AdminBlog() {
  const session = useAdminSession();
  const editorRef = useRef<HTMLElement | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<BlogForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === form.id) || null,
    [form.id, posts]
  );

  useEffect(() => {
    if (session.status !== "authorized") {
      return;
    }

    fetch(`/api/admin/blog?userId=${encodeURIComponent(session.userId)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se han podido cargar los articulos.");
        }

        return res.json() as Promise<BlogPost[]>;
      })
      .then((data) => {
        setPosts(data);
        setError("");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  const setField = <K extends keyof BlogForm>(field: K, value: BlogForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateTitle = (title: string) => {
    setForm((current) => ({
      ...current,
      title,
      slug: current.id || current.slug ? current.slug : normalizeSlug(title),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setNotice("");
    setError("");
  };

  const scrollToEditor = () => {
    window.setTimeout(() => {
      editorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const editPost = (post: BlogPost) => {
    setForm(toForm(post));
    setNotice("");
    setError("");
    scrollToEditor();
  };

  const upsertPost = (post: BlogPost) => {
    setPosts((current) => {
      const exists = current.some((item) => item.id === post.id);
      const next = exists
        ? current.map((item) => (item.id === post.id ? post : item))
        : [post, ...current];

      return next.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
    setForm(toForm(post));
  };

  const savePost = async (status?: "draft" | "published") => {
    setSaving(true);
    setError("");
    setNotice("");

    const body = {
      ...form,
      slug: normalizeSlug(form.slug || form.title),
      status: status || form.status,
      ...(form.id ? { postId: form.id } : {}),
      userId: session.userId,
    };

    const res = await fetch("/api/admin/blog", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);

    setSaving(false);

    if (!res.ok) {
      setError(data?.error || "No se ha podido guardar el articulo.");
      return;
    }

    upsertPost(data as BlogPost);
    setNotice(
      status === "published"
        ? "Articulo publicado."
        : status === "draft"
          ? "Borrador guardado."
          : "Cambios guardados."
    );
  };

  const changePublication = async (postId: string, action: "publish" | "unpublish") => {
    setSaving(true);
    setError("");
    setNotice("");

    const res = await fetch("/api/admin/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.userId, postId, action }),
    });
    const data = await res.json().catch(() => null);

    setSaving(false);

    if (!res.ok) {
      setError(data?.error || "No se ha podido actualizar el articulo.");
      return;
    }

    upsertPost(data as BlogPost);
    setNotice(action === "publish" ? "Articulo publicado." : "Articulo despublicado.");
  };

  const deletePost = async (postId: string) => {
    if (!window.confirm("Eliminar este articulo de forma permanente?")) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const res = await fetch("/api/admin/blog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.userId, postId }),
    });
    const data = await res.json().catch(() => null);

    setSaving(false);

    if (!res.ok) {
      setError(data?.error || "No se ha podido eliminar el articulo.");
      return;
    }

    setPosts((current) => current.filter((post) => post.id !== postId));
    if (form.id === postId) {
      setForm(emptyForm);
    }
    setNotice("Articulo eliminado.");
  };

  const uploadCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError("");

    const res = await fetch(`/api/uploads/blog-cover?userId=${encodeURIComponent(session.userId)}`, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const data = await res.json().catch(() => null);

    setUploading(false);
    event.target.value = "";

    if (!res.ok) {
      setError(data?.error || "No se ha podido subir la portada.");
      return;
    }

    setField("coverImageUrl", data.url);
  };

  return (
    <AdminLayout
      session={session}
      title="Blog"
      description="Articulos SEO sobre moda flamenca, ferias, tendencias, segunda mano y guias de compra o venta."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-4">
            <div>
              <h2 className="font-serif text-2xl text-stone-950">Articulos</h2>
              <p className="text-sm text-stone-500">
                {posts.length} en total
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-800"
            >
              Nuevo
            </button>
          </div>

          {loading && (
            <p className="px-4 py-5 text-sm text-stone-500">Cargando blog...</p>
          )}

          {!loading && posts.length === 0 && (
            <p className="px-4 py-5 text-sm text-stone-500">
              Todavia no hay articulos.
            </p>
          )}

          <div className="divide-y divide-stone-100">
            {posts.map((post) => (
              <article
                key={post.id}
                className={`border-l-4 p-4 transition ${
                  form.id === post.id
                    ? "border-l-green-700 bg-[#f8f3ef]"
                    : "border-l-transparent bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => editPost(post)}
                  className="block w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-950">{post.title}</h3>
                      <p className="mt-1 break-all text-xs font-semibold text-stone-500">
                        /blog/{post.slug}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                        post.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {post.status === "published" ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
                    {post.excerpt}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {formatDate(post.publishedAt)}
                  </p>
                </button>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => editPost(post)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      form.id === post.id
                        ? "bg-green-700 text-white hover:bg-green-800"
                        : "border border-stone-200 text-stone-700 hover:border-green-700 hover:text-green-800"
                    }`}
                  >
                    Editar
                  </button>
                  {post.status === "published" && (
                    <Link
                      href={`/blog/${post.slug}`}
                      className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-green-700 hover:text-green-800"
                    >
                      Ver
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      changePublication(
                        post.id,
                        post.status === "published" ? "unpublish" : "publish"
                      )
                    }
                    disabled={saving}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-red-700 hover:text-red-700 disabled:opacity-60"
                  >
                    {post.status === "published" ? "Despublicar" : "Publicar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePost(post.id)}
                    disabled={saving}
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          ref={editorRef}
          className="scroll-mt-6 rounded-lg border border-stone-200 bg-white p-4 shadow-sm md:p-6"
        >
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-700">
                {form.id ? "Editar articulo" : "Nuevo articulo"}
              </p>
              <h2 className="mt-1 font-serif text-3xl text-stone-950">
                {form.title || "Borrador sin titulo"}
              </h2>
            </div>
            {selectedPost && (
              <span className="rounded-full bg-[#f8f3ef] px-3 py-1 text-xs font-black text-stone-700">
                Actualizado {formatDate(selectedPost.updatedAt)}
              </span>
            )}
          </div>

          {(error || notice) && (
            <p
              className={`mt-4 rounded-lg border px-4 py-3 text-sm font-semibold ${
                error
                  ? "border-red-100 bg-red-50 text-red-700"
                  : "border-green-100 bg-green-50 text-green-800"
              }`}
            >
              {error || notice}
            </p>
          )}

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-stone-700">
              Titulo
              <input
                value={form.title}
                onChange={(event) => updateTitle(event.target.value)}
                className="rounded-lg border border-stone-200 px-4 py-3 font-normal text-stone-900 outline-none transition focus:border-green-700"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-stone-700">
              Slug
              <input
                value={form.slug}
                onChange={(event) => setField("slug", normalizeSlug(event.target.value))}
                className="rounded-lg border border-stone-200 px-4 py-3 font-normal text-stone-900 outline-none transition focus:border-green-700"
                placeholder="guia-comprar-traje-flamenca-segunda-mano"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-stone-700">
              Entradilla
              <textarea
                value={form.excerpt}
                onChange={(event) => setField("excerpt", event.target.value)}
                rows={3}
                className="rounded-lg border border-stone-200 px-4 py-3 font-normal leading-6 text-stone-900 outline-none transition focus:border-green-700"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-stone-700">
              Contenido
              <textarea
                value={form.content}
                onChange={(event) => setField("content", event.target.value)}
                rows={14}
                className="rounded-lg border border-stone-200 px-4 py-3 font-normal leading-7 text-stone-900 outline-none transition focus:border-green-700"
              />
            </label>

            <div className="grid gap-3 rounded-lg border border-stone-200 bg-[#f8f3ef] p-4">
              <label className="grid gap-2 text-sm font-bold text-stone-700">
                Portada opcional
                <input
                  value={form.coverImageUrl}
                  onChange={(event) => setField("coverImageUrl", event.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3 font-normal text-stone-900 outline-none transition focus:border-green-700"
                  placeholder="/uploads/blog/imagen.webp"
                />
              </label>
              <label className="w-fit cursor-pointer rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:border-green-700 hover:text-green-800">
                {uploading ? "Subiendo..." : "Subir portada"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadCover}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
              {form.coverImageUrl && (
                <img
                  src={form.coverImageUrl}
                  alt=""
                  className="aspect-[16/9] w-full rounded-lg object-cover"
                />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-stone-700">
                SEO title
                <input
                  value={form.seoTitle}
                  onChange={(event) => setField("seoTitle", event.target.value)}
                  className="rounded-lg border border-stone-200 px-4 py-3 font-normal text-stone-900 outline-none transition focus:border-green-700"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-stone-700">
                Estado
                <select
                  value={form.status}
                  onChange={(event) =>
                    setField("status", event.target.value as BlogForm["status"])
                  }
                  className="rounded-lg border border-stone-200 px-4 py-3 font-normal text-stone-900 outline-none transition focus:border-green-700"
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold text-stone-700">
              SEO description
              <textarea
                value={form.seoDescription}
                onChange={(event) => setField("seoDescription", event.target.value)}
                rows={3}
                className="rounded-lg border border-stone-200 px-4 py-3 font-normal leading-6 text-stone-900 outline-none transition focus:border-green-700"
              />
            </label>

            <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">
              {form.id && (
                <button
                  type="button"
                  onClick={() => savePost()}
                  disabled={saving || uploading}
                  className="rounded-lg bg-stone-950 px-4 py-2 text-sm font-black text-white transition hover:bg-stone-800 disabled:opacity-60"
                >
                  Guardar cambios
                </button>
              )}
              <button
                type="button"
                onClick={() => savePost("draft")}
                disabled={saving || uploading}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-black text-stone-700 transition hover:border-green-700 hover:text-green-800 disabled:opacity-60"
              >
                Guardar borrador
              </button>
              <button
                type="button"
                onClick={() => savePost("published")}
                disabled={saving || uploading}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-black text-white transition hover:bg-green-800 disabled:opacity-60"
              >
                Publicar
              </button>
              {form.id && form.status === "published" && (
                <button
                  type="button"
                  onClick={() => changePublication(form.id, "unpublish")}
                  disabled={saving}
                  className="rounded-lg bg-stone-100 px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-200 disabled:opacity-60"
                >
                  Despublicar
                </button>
              )}
              {form.id && (
                <button
                  type="button"
                  onClick={() => deletePost(form.id)}
                  disabled={saving}
                  className="ml-auto rounded-lg bg-red-50 px-4 py-2 text-sm font-black text-red-800 transition hover:bg-red-100 disabled:opacity-60"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
