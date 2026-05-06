import AdminLayout, { useAdminSession } from "../../components/admin/AdminLayout";

export default function AdminSettings() {
  const session = useAdminSession();

  return (
    <AdminLayout
      session={session}
      title="Configuracion"
      description="Ajustes generales del proyecto y espacio para futuras opciones."
    >
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-semibold text-stone-500">
            Nombre del proyecto
          </label>
          <input
            value="Faralaes"
            readOnly
            className="mt-3 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 font-semibold text-stone-800"
          />
        </article>

        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-semibold text-stone-500">
            Email de contacto
          </label>
          <input
            value="contacto@faralaes.es"
            readOnly
            className="mt-3 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 font-semibold text-stone-800"
          />
        </article>

        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-500">
                Modo mantenimiento
              </p>
              <p className="mt-2 text-sm text-stone-600">
                Placeholder para activar avisos o bloquear publicaciones en el
                futuro.
              </p>
            </div>
            <label className="inline-flex items-center gap-3 text-sm font-semibold text-stone-700">
              <input type="checkbox" disabled className="h-5 w-5" />
              Desactivado
            </label>
          </div>
        </article>
      </section>
    </AdminLayout>
  );
}
