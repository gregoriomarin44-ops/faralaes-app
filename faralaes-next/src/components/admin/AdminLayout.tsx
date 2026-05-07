import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
};

type AdminSession =
  | { status: "loading"; userId: ""; user: null }
  | { status: "authorized"; userId: string; user: AdminUser }
  | { status: "denied"; userId: string; user: null };

const links = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/anuncios", label: "Anuncios" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/facturacion", label: "Facturacion" },
  { href: "/admin/cookies", label: "Cookies" },
  { href: "/admin/configuracion", label: "Configuracion" },
];

export function useAdminSession(): AdminSession {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession>({
    status: "loading",
    userId: "",
    user: null,
  });

  useEffect(() => {
    fetch("/api/admin/me")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
          return null;
        }

        if (res.status === 403) {
          setSession({ status: "denied", userId: "", user: null });
          return null;
        }

        if (!res.ok) {
          throw new Error("No se ha podido validar el acceso.");
        }

        return (await res.json()) as AdminUser;
      })
      .then((user) => {
        if (user) {
          setSession({ status: "authorized", userId: user.id, user });
        }
      })
      .catch(() => {
        setSession({ status: "denied", userId: "", user: null });
      });
  }, [router]);

  return session;
}

type AdminLayoutProps = {
  children: React.ReactNode;
  description?: string;
  session: AdminSession;
  title: string;
};

export default function AdminLayout({
  children,
  description,
  session,
  title,
}: AdminLayoutProps) {
  const router = useRouter();

  if (session.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f3ef] px-6">
        <div className="rounded-lg border border-stone-200 bg-white px-6 py-5 text-sm font-semibold text-stone-700 shadow-sm">
          Validando acceso de administracion...
        </div>
      </main>
    );
  }

  if (session.status === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f3ef] px-6">
        <section className="max-w-md rounded-lg border border-red-100 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
            Acceso denegado
          </p>
          <h1 className="mt-3 font-serif text-4xl text-stone-950">
            Zona privada
          </h1>
          <p className="mt-4 text-stone-600">
            Tu cuenta esta identificada, pero no tiene permisos de
            administrador para entrar en este panel.
          </p>
          <Link
            href="/catalogo"
            className="mt-6 inline-flex rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            Volver al catalogo
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f3ef] text-stone-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-stone-200 bg-white px-4 py-4 lg:w-64 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link href="/" className="font-serif text-2xl font-semibold text-red-800">
              Faralaes
            </Link>
            <span className="rounded-full bg-[#f8f3ef] px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-800 lg:mt-3 lg:inline-block">
              Admin
            </span>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto lg:mt-8 lg:flex-col lg:overflow-visible">
            {links.map((link) => {
              const active = router.pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-green-700 text-white"
                      : "text-stone-700 hover:bg-[#f8f3ef] hover:text-green-800"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/catalogo"
            className="mt-8 hidden rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-green-700 hover:text-green-800 lg:block"
          >
            Ver sitio publico
          </Link>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-stone-200 bg-white px-5 py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                  Panel Faralaes
                </p>
                <h1 className="mt-2 font-serif text-3xl md:text-4xl">
                  {title}
                </h1>
                {description && (
                  <p className="mt-2 max-w-2xl text-sm text-stone-600">
                    {description}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-stone-200 bg-[#f8f3ef] px-4 py-2 text-sm text-stone-700">
                <span className="block font-semibold text-stone-950">
                  {session.user.email}
                </span>
                Administrador
              </div>
            </div>
          </header>

          <main className="px-5 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
