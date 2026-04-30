import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const RequireVerifiedEmail = () => {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setAuthLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 text-center text-muted-foreground">Cargando sesión...</section>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!session.user.email_confirmed_at) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 md:py-28 text-center">
          <h1 className="font-serif text-3xl md:text-5xl mb-4">Revisa tu correo para verificar tu cuenta</h1>
          <p className="text-muted-foreground mb-8">Confirma tu email antes de publicar prendas o acceder a tus zonas privadas.</p>
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-deep transition-smooth">
            Volver al inicio
          </Link>
        </section>
      </main>
    );
  }

  return <Outlet />;
};
