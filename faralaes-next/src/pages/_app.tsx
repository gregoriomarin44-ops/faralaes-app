import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import { AuthProvider } from "../lib/authContext";
import { SITE_URL } from "../lib/seo";

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Faralaes",
  url: SITE_URL,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Faralaes",
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512.png`,
};

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const showFooter = !router.pathname.startsWith("/admin");
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  const [isStartupSplashLeaving, setIsStartupSplashLeaving] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("No se ha podido registrar el service worker", error);
      });
    }
  }, []);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => {
      setIsStartupSplashLeaving(true);
    }, 650);
    const removeTimer = window.setTimeout(() => {
      setShowStartupSplash(false);
    }, 900);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  return (
    <AuthProvider>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </Head>
      {showStartupSplash && (
        <div
          aria-hidden="true"
          className={`startup-splash${isStartupSplashLeaving ? " startup-splash--leaving" : ""}`}
        >
          <img
            src="/apple-touch-icon.png"
            alt=""
            className="startup-splash__logo"
            width="84"
            height="84"
          />
          <span className="startup-splash__title">Faralaes</span>
        </div>
      )}
      <Component {...pageProps} />
      {showFooter && <Footer />}
      <CookieBanner />
    </AuthProvider>
  );
}
