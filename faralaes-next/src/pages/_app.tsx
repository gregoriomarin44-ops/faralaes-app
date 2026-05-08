import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
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
  logo: `${SITE_URL}/favicon-512.png`,
};

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const showFooter = !router.pathname.startsWith("/admin");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("No se ha podido registrar el service worker", error);
      });
    }
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
      <Component {...pageProps} />
      {showFooter && <Footer />}
      <CookieBanner />
    </AuthProvider>
  );
}
