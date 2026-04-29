import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Navigate } from "react-router-dom";
import { SellForm } from "@/components/SellForm";
import { supabase } from "@/integrations/supabase/client";

const PublishListing = () => {
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
    return <Navigate to="/auth" replace state={{ from: "/publicar" }} />;
  }

  return (
    <main className="min-h-screen bg-background">
      <SellForm />
    </main>
  );
};

export default PublishListing;
