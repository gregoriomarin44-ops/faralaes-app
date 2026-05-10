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
      className="absolute inset-x-0 top-full z-40 animate-[fade-up_180ms_ease_both] border-b border-stone-200 bg-white shadow-[0_8px_18px_rgba(34,24,20,0.06)] md:hidden"
      aria-label="Instalar Faralaes"
    >
      <div className="mx-auto flex h-[68px] max-w-md items-center gap-2.5 px-3">
        <img
          src="/icons/icon-192.png"
          width="40"
          height="40"
          alt=""
          className="h-10 w-10 shrink-0 rounded-xl"
          loading="lazy"
          decoding="async"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight text-stone-950">
            {content.title}
          </p>
          <p className="mt-1 truncate text-[11px] font-semibold leading-tight text-stone-600">
            <span className="text-red-800" aria-hidden="true">
              ★★★★★
            </span>{" "}
            {content.trustLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={installApp}
          className="h-8 shrink-0 rounded-full border border-red-800 bg-red-50 px-3 text-xs font-bold text-red-800 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2"
        >
          Abrir app
        </button>

        <button
          type="button"
          onClick={closeBanner}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </aside>
  );
}
