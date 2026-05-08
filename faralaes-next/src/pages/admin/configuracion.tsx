import AdminLayout, { useAdminSession } from "../../components/admin/AdminLayout";
import { useState } from "react";

export default function AdminSettings() {
  const session = useAdminSession();
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailMessage, setTestEmailMessage] = useState("");
  const [testEmailError, setTestEmailError] = useState("");

  const sendTestEmail = async () => {
    setSendingTestEmail(true);
    setTestEmailMessage("");
    setTestEmailError("");

    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "No se ha podido enviar el email de prueba.");
      }

      setTestEmailMessage(data?.message || "Email de prueba enviado.");
    } catch (error) {
      setTestEmailError(
        error instanceof Error
          ? error.message
          : "No se ha podido enviar el email de prueba."
      );
    } finally {
      setSendingTestEmail(false);
    }
  };

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

        {session.status === "authorized" && session.user.role === "ADMIN" && (
          <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-500">
                  Email SMTP
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  Envia un email de prueba a {session.user.email}.
                </p>
              </div>
              <button
                type="button"
                onClick={sendTestEmail}
                disabled={sendingTestEmail}
                className="inline-flex justify-center rounded-lg bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {sendingTestEmail ? "Enviando..." : "Enviar email de prueba"}
              </button>
            </div>
            {testEmailMessage && (
              <p className="mt-4 text-sm font-semibold text-green-700">
                {testEmailMessage}
              </p>
            )}
            {testEmailError && (
              <p className="mt-4 text-sm font-semibold text-red-700">
                {testEmailError}
              </p>
            )}
          </article>
        )}
      </section>
    </AdminLayout>
  );
}
