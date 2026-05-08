import Link from "next/link";
import { useEffect, useState } from "react";
import AdminLayout, { useAdminSession } from "../../components/admin/AdminLayout";
import { formatPrice } from "../../lib/formatPrice";

type DashboardListing = {
  id: string;
  title: string;
  priceCents: number;
  status: string;
  createdAt: string;
  seller: {
    email: string;
    profile: {
      displayName: string;
    } | null;
  };
};

type DashboardUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "USER";
  disabled: boolean;
  createdAt: string;
  profile: {
    displayName: string;
  } | null;
};

type DashboardReport = {
  id: string;
  targetType: "listing" | "user";
  reason: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: string;
  reporter: {
    username: string;
    displayName: string;
  };
  target:
    | { title: string; status: string }
    | { username: string; displayName: string; disabled: boolean }
    | null;
};

type MetricRow = {
  label: string;
  value: number;
  id?: string;
  status?: string;
};

type ChartPoint = {
  label: string;
  value: number;
};

type Kpi = {
  label: string;
  tone?: "neutral" | "green" | "red";
  value: number | string;
};

type DashboardData = {
  range: 7 | 30 | 90;
  totals: {
    totalListings: number;
    publishedListings: number;
    hiddenListings: number;
    totalUsers: number;
    pendingReports: number;
    totalFavorites: number;
    totalMessages: number;
    disabledUsers: number;
  };
  period: {
    publishedListings: number;
    hiddenListings: number;
    publishedToday: number;
    newUsers: number;
    pendingReports: number;
    createdReports: number;
    favorites: number;
    messages: number;
  };
  latestListings: DashboardListing[];
  latestUsers: DashboardUser[];
  latestReports: DashboardReport[];
  charts: {
    listingsByDay: ChartPoint[];
    usersByDay: ChartPoint[];
  };
  marketplace: {
    topCategories: MetricRow[];
    topLocations: MetricRow[];
    topFavoriteListings: MetricRow[];
    topSellers: MetricRow[];
  };
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getReportTargetLabel = (report: DashboardReport) => {
  if (!report.target) {
    return "Objetivo no disponible";
  }

  if ("title" in report.target) {
    return report.target.title;
  }

  return report.target.displayName || `@${report.target.username}`;
};

function KpiCard({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "neutral" | "green" | "red";
  value: number | string;
}) {
  const toneClass =
    tone === "green"
      ? "text-green-800"
      : tone === "red"
        ? "text-red-700"
        : "text-stone-950";

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-stone-500">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${toneClass}`}>{value}</p>
    </article>
  );
}

function Panel({
  children,
  href,
  linkLabel,
  title,
}: {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-4">
        <h2 className="font-serif text-2xl">{title}</h2>
        {href && linkLabel && (
          <Link
            href={href}
            className="text-sm font-semibold text-green-800 hover:text-green-900"
          >
            {linkLabel}
          </Link>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className="px-5 py-4 text-sm text-stone-500">{children}</p>;
}

function BarChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex h-52 min-w-max items-end gap-3 px-5 pb-5 pt-6">
        {data.map((item) => (
          <div key={item.label} className="flex w-12 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end rounded bg-[#f8f3ef]">
              <div
                className="w-full rounded bg-green-700 transition-all"
                style={{ height: `${Math.max((item.value / max) * 100, item.value ? 8 : 0)}%` }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
            <p className="text-xs font-semibold text-stone-500">{item.label}</p>
            <p className="text-sm font-bold text-stone-950">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingList({
  empty,
  items,
  suffix,
}: {
  empty: string;
  items: MetricRow[];
  suffix: string;
}) {
  if (items.length === 0) {
    return <EmptyState>{empty}</EmptyState>;
  }

  return (
    <div className="divide-y divide-stone-100">
      {items.map((item) => (
        <div key={`${item.label}-${item.id || ""}`} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-stone-950">{item.label}</p>
            {item.status && (
              <p className="text-xs text-stone-500">Estado: {item.status}</p>
            )}
          </div>
          <p className="shrink-0 rounded-full bg-[#f8f3ef] px-3 py-1 text-xs font-bold text-stone-700">
            {item.value} {suffix}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function AdminHome() {
  const session = useAdminSession();
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session.status !== "authorized") {
      return;
    }

    fetch(
      `/api/admin/dashboard?userId=${encodeURIComponent(session.userId)}&range=${range}`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se han podido cargar los datos del panel.");
        }

        return res.json() as Promise<DashboardData>;
      })
      .then((dashboardData) => {
        setData(dashboardData);
        setError("");
      })
      .catch((err: Error) => setError(err.message));
  }, [range, session]);

  const totalKpis: Kpi[] = [
    { label: "Usuarios totales", value: data?.totals.totalUsers ?? "-" },
    { label: "Anuncios publicados totales", value: data?.totals.publishedListings ?? "-" },
    { label: "Favoritos totales", value: data?.totals.totalFavorites ?? "-" },
    { label: "Mensajes totales", value: data?.totals.totalMessages ?? "-" },
  ];

  const periodKpis: Kpi[] = [
    { label: "Nuevos usuarios", value: data?.period.newUsers ?? "-", tone: "green" as const },
    { label: "Anuncios publicados", value: data?.period.publishedListings ?? "-", tone: "green" as const },
    {
      label: "Anuncios ocultos",
      value: data?.period.hiddenListings ?? "-",
      tone: "red" as const,
    },
    {
      label: "Reportes pendientes",
      value: data?.period.pendingReports ?? "-",
      tone: "red" as const,
    },
    { label: "Reportes creados", value: data?.period.createdReports ?? "-", tone: "red" as const },
    { label: "Favoritos", value: data?.period.favorites ?? "-" },
    { label: "Mensajes", value: data?.period.messages ?? "-" },
    {
      label: "Publicados hoy",
      value: data?.period.publishedToday ?? "-",
      tone: "green" as const,
    },
  ];

  return (
    <AdminLayout
      session={session}
      title="Resumen"
      description="Vista operativa del marketplace: crecimiento, actividad, salud del catalogo y moderacion."
    >
      {error && (
        <p className="mb-5 rounded-lg border border-red-100 bg-white px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <section className="mb-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-2xl">Rango temporal</h2>
            <p className="mt-1 text-sm text-stone-600">
              Filtra actividad, rankings y graficas del panel.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-[#f8f3ef] p-1">
            {([7, 30, 90] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                  range === option
                    ? "bg-white text-green-800 shadow-sm"
                    : "text-stone-600 hover:text-green-800"
                }`}
              >
                {option} dias
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {totalKpis.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            tone={card.tone}
          />
        ))}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {periodKpis.map((card) => (
          <KpiCard
            key={card.label}
            label={`${card.label} (${range} dias)`}
            value={card.value}
            tone={card.tone}
          />
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          label="Moderacion: reportes pendientes"
          value={data?.totals.pendingReports ?? "-"}
          tone="red"
        />
        <KpiCard
          label="Moderacion: usuarios desactivados"
          value={data?.totals.disabledUsers ?? "-"}
          tone="red"
        />
        <KpiCard
          label="Moderacion: anuncios ocultos"
          value={data?.totals.hiddenListings ?? "-"}
          tone="red"
        />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Anuncios publicados por dia">
          <BarChart data={data?.charts.listingsByDay || []} />
        </Panel>
        <Panel title="Registros de usuarios por dia">
          <BarChart data={data?.charts.usersByDay || []} />
        </Panel>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Ultimos usuarios registrados" href="/admin/usuarios" linkLabel="Ver usuarios">
          <div className="divide-y divide-stone-100">
            {data?.latestUsers.map((user) => (
              <div key={user.id} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-semibold">
                    {user.displayName || user.profile?.displayName || "Sin nombre publico"}
                  </p>
                  <p className="text-sm text-stone-500">@{user.username}</p>
                </div>
                <div className="text-left text-sm text-stone-500 sm:text-right">
                  <p>{user.disabled ? "Desactivado" : user.role}</p>
                  <p>{formatDate(user.createdAt)}</p>
                </div>
              </div>
            ))}
            {data && data.latestUsers.length === 0 && (
              <EmptyState>Todavia no hay usuarios.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel title="Ultimos anuncios publicados" href="/admin/anuncios" linkLabel="Ver todos">
          <div className="divide-y divide-stone-100">
            {data?.latestListings.map((listing) => (
              <div key={listing.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-semibold">{listing.title}</p>
                  <p className="text-sm text-stone-500">
                    {listing.seller.profile?.displayName || listing.seller.email}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-semibold text-red-700">
                    {formatPrice(listing.priceCents)}
                  </p>
                  <p className="text-sm text-stone-500">
                    {formatDate(listing.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {data && data.latestListings.length === 0 && (
              <EmptyState>Todavia no hay anuncios publicados.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel title="Ultimos reportes" href="/admin/reportes" linkLabel="Ver reportes">
          <div className="divide-y divide-stone-100">
            {data?.latestReports.map((report) => (
              <div key={report.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">
                    {report.targetType === "listing" ? "Anuncio" : "Usuario"} · {report.reason}
                  </p>
                  <span className="rounded-full bg-[#f8f3ef] px-2 py-1 text-xs font-bold text-stone-600">
                    {report.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-600">{getReportTargetLabel(report)}</p>
                <p className="mt-1 text-xs text-stone-500">
                  Reporta: {report.reporter.displayName || `@${report.reporter.username}`} · {formatDate(report.createdAt)}
                </p>
              </div>
            ))}
            {data && data.latestReports.length === 0 && (
              <EmptyState>No hay reportes recientes.</EmptyState>
            )}
          </div>
        </Panel>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Categorias mas usadas">
          <RankingList
            empty="Sin categorias suficientes."
            items={data?.marketplace.topCategories || []}
            suffix="anuncios"
          />
        </Panel>
        <Panel title="Provincias y ubicaciones mas activas">
          <RankingList
            empty="Sin ubicaciones suficientes."
            items={data?.marketplace.topLocations || []}
            suffix="anuncios"
          />
        </Panel>
        <Panel title="Anuncios mas favoritos">
          <RankingList
            empty="Todavia no hay favoritos."
            items={data?.marketplace.topFavoriteListings || []}
            suffix="favoritos"
          />
        </Panel>
        <Panel title="Usuarios con mas anuncios">
          <RankingList
            empty="Todavia no hay vendedores activos."
            items={data?.marketplace.topSellers || []}
            suffix="anuncios"
          />
        </Panel>
      </section>
    </AdminLayout>
  );
}
