import { useEffect, useState } from "react";
import AdminLayout, { useAdminSession } from "../../components/admin/AdminLayout";

type AdminUserRow = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  profile: {
    displayName: string;
    phone: string | null;
    location: string | null;
  } | null;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function AdminUsers() {
  const session = useAdminSession();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadUsers = async () => {
    const res = await fetch(
      `/api/admin/users?userId=${encodeURIComponent(session.userId)}`
    );

    if (!res.ok) {
      throw new Error("No se han podido cargar los usuarios.");
    }

    const data = (await res.json()) as AdminUserRow[];
    setUsers(data);
    setError("");
  };

  useEffect(() => {
    if (session.status !== "authorized") {
      return;
    }

    loadUsers()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  const updateRole = async (
    targetUserId: string,
    role: AdminUserRow["role"]
  ) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.userId, targetUserId, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "No se ha podido actualizar el rol.");
      return;
    }

    setUsers((prev) =>
      prev.map((user) => (user.id === targetUserId ? data : user))
    );
    setSelectedUser((prev) =>
      prev?.id === targetUserId ? (data as AdminUserRow) : prev
    );
    setError("");
  };

  const resetPassword = async (targetUserId: string) => {
    const confirmed = confirm(
      "¿Seguro que quieres resetear la contraseña de este usuario?"
    );

    if (!confirmed) {
      return;
    }

    const res = await fetch(
      `/api/admin/users/${targetUserId}/reset-password?userId=${encodeURIComponent(
        session.userId
      )}`,
      {
        method: "PATCH",
      }
    );
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error || "No se ha podido resetear la contraseña.");
      setSuccessMessage("");
      return;
    }

    setError("");
    setSuccessMessage(
      `Contraseña temporal: ${data.temporaryPassword || "Faralaes123!"}`
    );
  };

  const verifyUser = async (targetUserId: string) => {
    const confirmed = confirm(
      "¿Seguro que quieres verificar manualmente este usuario?"
    );

    if (!confirmed) {
      return;
    }

    const res = await fetch(
      `/api/admin/users/${targetUserId}/verify?userId=${encodeURIComponent(
        session.userId
      )}`,
      {
        method: "PATCH",
      }
    );
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error || "No se ha podido verificar el usuario.");
      setSuccessMessage("");
      return;
    }

    await loadUsers();
    setError("");
    setSuccessMessage("Usuario verificado correctamente");
  };

  return (
    <AdminLayout
      session={session}
      title="Usuarios"
      description="Gestion de cuentas registradas y roles del panel."
    >
      {error && (
        <p className="mb-5 rounded-lg border border-red-100 bg-white px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="mb-5 rounded-lg border border-green-100 bg-white px-4 py-3 text-sm font-semibold text-green-800">
          {successMessage}
        </p>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Alta</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-4 font-semibold text-stone-950">
                      {user.email}
                    </td>
                    <td className="px-4 py-4 text-stone-600">
                      {user.profile?.displayName || "Sin perfil"}
                    </td>
                    <td className="px-4 py-4 text-stone-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateRole(
                            user.id,
                            e.target.value as AdminUserRow["role"]
                          )
                        }
                        disabled={user.id === session.userId}
                        className="rounded-lg border border-stone-200 bg-white px-3 py-2 font-semibold text-stone-700 disabled:cursor-not-allowed disabled:bg-stone-100"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="rounded-lg border border-stone-200 px-3 py-2 font-semibold text-stone-700 transition hover:border-green-700 hover:text-green-800"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => resetPassword(user.id)}
                          className="rounded-lg border border-stone-200 px-3 py-2 font-semibold text-stone-700 transition hover:border-red-700 hover:text-red-700"
                        >
                          Reset contraseña
                        </button>
                        <button
                          type="button"
                          onClick={() => verifyUser(user.id)}
                          className="rounded-lg border border-stone-200 px-3 py-2 font-semibold text-stone-700 transition hover:border-green-700 hover:text-green-800"
                        >
                          Verificar usuario
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <p className="px-5 py-4 text-sm text-stone-500">
              Cargando usuarios...
            </p>
          )}

          {!loading && users.length === 0 && (
            <p className="px-5 py-4 text-sm text-stone-500">
              Todavia no hay usuarios registrados.
            </p>
          )}
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-2xl">Detalle basico</h2>
          {selectedUser ? (
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-stone-500">Email</p>
                <p className="break-words text-stone-950">{selectedUser.email}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-500">Nombre</p>
                <p>{selectedUser.profile?.displayName || "Sin perfil"}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-500">Telefono</p>
                <p>{selectedUser.profile?.phone || "No indicado"}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-500">Ubicacion</p>
                <p>{selectedUser.profile?.location || "No indicada"}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-500">Rol</p>
                <p>{selectedUser.role}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-500">
              Selecciona un usuario para ver su informacion.
            </p>
          )}
        </aside>
      </section>
    </AdminLayout>
  );
}
