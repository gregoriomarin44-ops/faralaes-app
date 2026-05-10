import { useEffect, useState } from "react";

type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<BeforeInstallPromptChoice>;
  prompt: () => Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const DISMISS_STORAGE_KEY = "faralaes:pwa-install-banner:dismissed-until";
const DISMISS_DAYS = 7;

const bannerVariants = {
  default: {
    title: "¡Que no se te escape!",
    body: "Guarda favoritos y encuentra antes las mejores oportunidades flamencas.",
    trustLabel: "Moda flamenca de segunda mano",
  },
};

type BannerVariant = keyof typeof bannerVariants;

function isStandaloneDisplayMode() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

function isDismissedRecently() {
  try {
    const dismissedUntil = Number(localStorage.getItem(DISMISS_STORAGE_KEY));
    return Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();
  } catch {
    return false;
  }
}

function saveDismissal() {
  const dismissedUntil = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;

  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, String(dismissedUntil));
  } catch {
    // Storage can fail in private modes; the close action should still work.
  }
}

export default function PwaInstallBanner({
  variant = "default",
}: {
  variant?: BannerVariant;
}) {
  const content = bannerVariants[variant];
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplayMode() || isDismissedRecently()) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallPrompt(event);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const closeBanner = () => {
    saveDismissal();
    setIsVisible(false);
  };

  const installApp = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "dismissed") {
      saveDismissal();
    }

    setInstallPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible || !installPrompt) {
    return null;
  }

  return (
    <aside
      className="absolute inset-x-3 top-[calc(100%+0.5rem)] z-40 mx-auto max-w-md animate-[fade-up_220ms_ease_both] rounded-2xl border border-stone-100 bg-white p-3 shadow-[0_14px_38px_rgba(34,24,20,0.16)] md:hidden"
      aria-label="Instalar Faralaes"
    >
      <div className="flex gap-3">
        <img
          src="/icons/icon-192.png"
          width="38"
          height="38"
          alt=""
          className="h-9 w-9 shrink-0 rounded-xl"
          loading="lazy"
          decoding="async"
        />

        <div className="min-w-0 flex-1 pr-6">
          <p className="text-sm font-bold leading-tight text-stone-950">
            {content.title}
          </p>
          <p className="mt-1 text-xs leading-snug text-stone-600">
            {content.body}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold leading-none text-stone-600">
            <span className="text-red-800" aria-hidden="true">
              ★ ★ ★ ★ ★
            </span>
            <span>{content.trustLabel}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={closeBanner}
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-xl leading-none text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        onClick={installApp}
        className="mt-3 h-10 w-full rounded-full bg-red-800 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2"
      >
        Instalar
      </button>
    </aside>
  );
}
