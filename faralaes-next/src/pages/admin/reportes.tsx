import Link from "next/link";
import { useEffect, useState } from "react";
import AdminLayout, { useAdminSession } from "../../components/admin/AdminLayout";

type Reporter = {
  email: string;
  username: string;
  displayName: string;
};

type ListingTarget = {
  id: string;
  title: string;
  status: string;
  sellerId: string;
} | null;

type UserTarget = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  disabled: boolean;
} | null;

type Report = {
  id: string;
  reporterUserId: string;
  targetType: "listing" | "user";
  targetId: string;
  reason: string;
  details: string | null;
  status: "pending" | "reviewed" | "resolved";
  createdAt: string;
  reporter: Reporter;
  target: ListingTarget | UserTarget;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const statusLabel: Record<Report["status"], string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  resolved: "Resuelto",
};

export default function AdminReportes() {
  const session = useAdminSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = () => {
    if (session.status !== "authorized") {
      return;
    }

    setLoading(true);
    fetch(`/api/admin/reports?userId=${encodeURIComponent(session.userId)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se han podido cargar los reportes.");
        }

        return res.json() as Promise<Report[]>;
      })
      .then((data) => {
        setReports(data);
        setError("");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, [session]);

  const patchReport = async (
    reportId: string,
    body: { status?: Report["status"]; action?: "hide_listing" | "disable_user" }
  ) => {
    const res = await fetch(
      `/api/admin/reports/${reportId}?userId=${encodeURIComponent(session.userId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, userId: session.userId }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "No se ha podido actualizar el reporte.");
      return;
    }

    loadReports();
  };

  const renderTarget = (report: Report) => {
    if (report.targetType === "listing") {
      const target = report.target as ListingTarget;

      if (!target) {
        return <span>Anuncio eliminado</span>;
      }

      return (
        <div>
          <Link
            href={`/producto/${target.id}`}
            className="font-semibold text-green-800 hover:text-green-900"
          >
            {target.title}
          </Link>
          <p className="text-xs text-stone-500">Estado: {target.status}</p>
        </div>
      );
    }

    const target = report.target as UserTarget;

    if (!target) {
      return <span>Usuario eliminado</span>;
    }

    return (
      <div>
        <p className="font-semibold">{target.displayName || target.email}</p>
        <p className="text-xs text-stone-500">
          @{target.username} · {target.disabled ? "Desactivado" : "Activo"}
        </p>
      </div>
    );
  };

  return (
    <AdminLayout
      session={session}
      title="Reportes"
      description="Revisa avisos de usuarios, prioriza casos urgentes y ejecuta acciones rápidas de moderacion."
    >
      {error && (
        <p className="mb-5 rounded-lg border border-red-100 bg-white px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-serif text-2xl">Cola de reportes</h2>
        </div>

        {loading ? (
          <p className="px-5 py-4 text-sm text-stone-500">Cargando reportes...</p>
        ) : reports.length === 0 ? (
          <p className="px-5 py-4 text-sm text-stone-500">
            No hay reportes pendientes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-[#f8f3ef] text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Objetivo</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Reportador</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reports.map((report) => (
                  <tr key={report.id} className="align-top">
                    <td className="px-4 py-4 text-stone-600">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      {report.targetType === "listing" ? "Anuncio" : "Usuario"}
                    </td>
                    <td className="px-4 py-4">{renderTarget(report)}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{report.reason}</p>
                      {report.details && (
                        <p className="mt-1 max-w-xs text-stone-500">
                          {report.details}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">
                        {report.reporter.displayName || report.reporter.email}
                      </p>
                      <p className="text-xs text-stone-500">
                        @{report.reporter.username}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[#f8f3ef] px-3 py-1 text-xs font-bold text-stone-700">
                        {statusLabel[report.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            patchReport(report.id, { status: "reviewed" })
                          }
                          className="rounded-full border border-stone-300 px-3 py-1 text-xs font-bold text-stone-700 transition hover:border-green-700 hover:text-green-700"
                        >
                          Marcar revisado
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            patchReport(report.id, { status: "resolved" })
                          }
                          className="rounded-full border border-stone-300 px-3 py-1 text-xs font-bold text-stone-700 transition hover:border-green-700 hover:text-green-700"
                        >
                          Resolver
                        </button>
                        {report.targetType === "listing" && (
                          <button
                            type="button"
                            onClick={() =>
                              patchReport(report.id, { action: "hide_listing" })
                            }
                            className="rounded-full bg-red-700 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-800"
                          >
                            Ocultar anuncio
                          </button>
                        )}
                        {report.targetType === "user" && (
                          <button
                            type="button"
                            onClick={() =>
                              patchReport(report.id, { action: "disable_user" })
                            }
                            className="rounded-full bg-red-700 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-800"
                          >
                            Desactivar usuario
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
