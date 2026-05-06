import Link from "next/link";
import AdminLayout, { useAdminSession } from "../../components/admin/AdminLayout";

export default function AdminCookies() {
  const session = useAdminSession();

  return (
    <AdminLayout
      session={session}
      title="Cookies"
      description="Seguimiento legal basico para banner, politicas y futuras integraciones."
    >
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-stone-500">
            Estado del banner
          </p>
          <p className="mt-3 text-2xl font-bold text-stone-950">
            Pendiente de revisar
          </p>
          <p className="mt-3 text-sm text-stone-500">
            Preparado para conectar una configuracion real del banner de
            consentimiento.
          </p>
        </article>

        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-stone-500">
            Politica de cookies
          </p>
          <Link
            href="/cookies"
            className="mt-3 inline-flex text-sm font-semibold text-green-800 hover:text-green-900"
          >
            Ver enlace publico previsto
          </Link>
          <p className="mt-3 text-sm text-stone-500">
            Si la ruta publica aun no existe, queda como referencia para crearla.
          </p>
        </article>

        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-stone-500">
            Futuras integraciones
          </p>
          <p className="mt-3 text-sm text-stone-500">
            CMP, registro de consentimientos, categorias de cookies y auditoria
            legal.
          </p>
        </article>
      </section>
    </AdminLayout>
  );
}
