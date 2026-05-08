import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import { AuthProvider } from "../lib/authContext";

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
      <Component {...pageProps} />
      {showFooter && <Footer />}
      <CookieBanner />
    </AuthProvider>
  );
}
