import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "login" | "register";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/";
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user.email_confirmed_at) {
        navigate(from);
      } else if (data.session && !data.session.user.email_confirmed_at) {
        setVerificationMessage("Revisa tu correo para verificar tu cuenta");
      }
    });
  }, [from, navigate]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const fullName = String(formData.get("fullName") || "").trim();

    setVerificationMessage(null);

    const { data: authData, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName || null,
              },
            },
          });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed") || error.message.toLowerCase().includes("not confirmed")) {
        setVerificationMessage("Debes verificar tu email antes de continuar.");
        toast.error("Debes verificar tu email antes de continuar.");
        return;
      }

      toast.error(error.message);
      return;
    }

    if (mode === "register") {
      if (authData.session) {
        await supabase.auth.signOut();
      }

      setVerificationMessage("Te hemos enviado un correo de verificación. Revisa tu email y confirma tu cuenta antes de entrar.");
      toast.success("Te hemos enviado un correo de verificación. Revisa tu email y confirma tu cuenta antes de entrar.");
      return;
    }

    if (!authData.session?.user.email_confirmed_at) {
      await supabase.auth.signOut();
      setVerificationMessage("Debes verificar tu email antes de continuar.");
      toast.error("Debes verificar tu email antes de continuar.");
      return;
    }

    toast.success("Sesión iniciada.");
    navigate(from);
  };

  const continueWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  const isLogin = mode === "login";

  return (
    <main className="min-h-screen bg-gradient-cream flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-md bg-card border border-border rounded-2xl shadow-soft p-6 md:p-8">
        <Link to="/" className="inline-block font-serif text-3xl italic font-semibold mb-8">
          Faral<span className="text-primary">aes</span>
        </Link>

        <div className="mb-6">
          <h1 className="font-serif text-3xl mb-2">{isLogin ? "Entrar" : "Crear cuenta"}</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin
              ? "Accede para guardar favoritos, publicar prendas y hablar con vendedoras."
              : "Regístrate con email y contraseña para empezar a vender o comprar."}
          </p>
          {verificationMessage && (
            <p className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
              {verificationMessage}
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre</Label>
              <Input id="fullName" name="fullName" autoComplete="name" maxLength={120} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>

          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {isLogin ? "Entrar" : "Crear cuenta"}
          </Button>
        </form>

        <button
          type="button"
          onClick={continueWithGoogle}
          className="mt-3 w-full inline-flex items-center justify-center gap-3 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 transition-smooth"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.23c0-.76-.07-1.49-.2-2.19H12v4.14h5.37a4.59 4.59 0 0 1-1.99 3.01v2.5h3.22c1.88-1.73 3-4.28 3-7.46z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.31l-3.22-2.5c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.75-5.59-4.11H3.08v2.58A10 10 0 0 0 12 22z" />
            <path fill="#FBBC05" d="M6.41 14.03a6.01 6.01 0 0 1 0-3.86V7.59H3.08a10 10 0 0 0 0 8.82l3.33-2.38z" />
            <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.83 1.5l2.86-2.86C16.96 2.99 14.7 2 12 2a10 10 0 0 0-8.92 5.59l3.33 2.58C7.2 7.71 9.4 5.96 12 5.96z" />
          </svg>
          <span>Continuar con Google</span>
        </button>

        <button
          type="button"
          className="mt-6 w-full text-sm text-muted-foreground hover:text-primary transition-smooth"
          onClick={() => setMode(isLogin ? "register" : "login")}
        >
          {isLogin ? "¿No tienes cuenta? Crear una" : "¿Ya tienes cuenta? Entrar"}
        </button>
      </section>
    </main>
  );
};

export default Auth;
