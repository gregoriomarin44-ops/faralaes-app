import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "login" | "register";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const fullName = String(formData.get("fullName") || "").trim();

    const { error } =
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
      toast.error(error.message);
      return;
    }

    if (mode === "register") {
      toast.success("Cuenta creada. Revisa tu email si Supabase pide confirmación.");
    } else {
      toast.success("Sesión iniciada.");
    }

    navigate("/");
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
