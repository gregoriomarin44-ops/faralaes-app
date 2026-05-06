import AdminLayout, { useAdminSession } from "../../components/admin/AdminLayout";

const modules = ["Pagos", "Suscripciones", "Comisiones", "Facturas"];

export default function AdminBilling() {
  const session = useAdminSession();

  return (
    <AdminLayout
      session={session}
      title="Facturacion"
      description="Base preparada para operaciones economicas del marketplace."
    >
      <section className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
        Pendiente de integrar pasarela de pago.
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => (
          <article
            key={module}
            className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
          >
            <p className="font-serif text-2xl">{module}</p>
            <p className="mt-3 text-sm text-stone-500">
              Espacio reservado para configurar y revisar {module.toLowerCase()}.
            </p>
          </article>
        ))}
      </section>
    </AdminLayout>
  );
}
