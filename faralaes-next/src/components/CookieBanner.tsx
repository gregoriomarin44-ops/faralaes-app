import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "faralaes_cookie_consent";

type CookieConsent = "accepted" | "rejected";

export const getCookieConsent = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsent | null;
};

export const canLoadAnalytics = () => getCookieConsent() === "accepted";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setVisible(!getCookieConsent());
  }, []);

  const saveConsent = (value: CookieConsent) => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <section
      aria-label="Preferencias de cookies"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-lg border border-stone-200 bg-white p-5 text-stone-800 shadow-2xl"
    >
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-red-700">
            Cookies
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Usamos cookies técnicas necesarias para que Faralaes funcione. Las
            cookies analíticas solo se cargarán si las aceptas.
          </p>
          {showSettings && (
            <div className="mt-3 rounded border border-stone-200 bg-[#f8f3ef] p-3 text-sm text-stone-700">
              <p>
                Técnicas: necesarias y siempre activas. Analíticas: opcionales,
                para medir uso agregado y mejorar la plataforma.
              </p>
              <Link
                href="/cookies"
                className="mt-2 inline-block font-semibold text-green-800 hover:text-green-900"
              >
                Ver política de cookies
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saveConsent("accepted")}
            className="rounded-full bg-green-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-green-800"
          >
            Aceptar
          </button>
          <button
            type="button"
            onClick={() => saveConsent("rejected")}
            className="rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-bold text-stone-700 transition hover:border-red-700 hover:text-red-700"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => setShowSettings((current) => !current)}
            className="rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-bold text-stone-700 transition hover:border-green-700 hover:text-green-700"
          >
            Configurar
          </button>
        </div>
      </div>
    </section>
  );
}
