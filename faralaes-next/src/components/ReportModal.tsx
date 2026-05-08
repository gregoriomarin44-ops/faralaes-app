import { FormEvent, useState } from "react";
import { REPORT_REASONS, ReportTargetType } from "../lib/reports";

const reasonLabels: Record<(typeof REPORT_REASONS)[number], string> = {
  spam: "Spam",
  fraude: "Fraude",
  "contenido inapropiado": "Contenido inapropiado",
  "articulo falso": "Articulo falso",
  otro: "Otro",
};

type ReportModalProps = {
  onClose: () => void;
  targetId: string;
  targetType: ReportTargetType;
  title: string;
};

export default function ReportModal({
  onClose,
  targetId,
  targetType,
  title,
}: ReportModalProps) {
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "No se ha podido enviar el reporte.");
      }

      setMessage("Reporte enviado. Gracias por ayudarnos a revisar Faralaes.");
      setDetails("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se ha podido enviar el reporte."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
              Moderacion
            </p>
            <h2 className="mt-2 font-serif text-3xl text-gray-950">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm font-bold text-gray-600 transition hover:border-red-700 hover:text-red-700"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={submitReport} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-gray-700">
            Motivo
            <select
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as (typeof REPORT_REASONS)[number])
              }
              className="mt-2 w-full rounded border border-gray-300 p-3 font-normal outline-none transition focus:border-green-700"
            >
              {REPORT_REASONS.map((reportReason) => (
                <option key={reportReason} value={reportReason}>
                  {reasonLabels[reportReason]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-gray-700">
            Detalles opcionales
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={1000}
              rows={4}
              className="mt-2 w-full rounded border border-gray-300 p-3 font-normal outline-none transition focus:border-green-700"
            />
          </label>

          {message && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || Boolean(message)}
            className="w-full rounded-full bg-red-700 px-5 py-3 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {submitting ? "Enviando..." : "Enviar reporte"}
          </button>
        </form>
      </section>
    </div>
  );
}
