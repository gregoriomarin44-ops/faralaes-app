import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type ProfileForm = {
  full_name: string;
  location: string;
  bio: string;
  phone: string;
};

const emptyProfile: ProfileForm = {
  full_name: "",
  location: "",
  bio: "",
  phone: "",
};

const EditProfile = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(userData.user.id);

      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("full_name,location,bio,phone")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setProfile({
        full_name: data?.full_name || "",
        location: data?.location || "",
        bio: data?.bio || "",
        phone: data?.phone || "",
      });
      setLoading(false);
    };

    loadProfile();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId) return;

    const formData = new FormData(event.currentTarget);
    const nextProfile = {
      id: userId,
      full_name: String(formData.get("full_name") || "").trim() || null,
      location: String(formData.get("location") || "").trim() || null,
      bio: String(formData.get("bio") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
    };

    setSaving(true);

    const { error } = await (supabase as any)
      .from("profiles")
      .upsert(nextProfile, { onConflict: "id" });

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setProfile({
      full_name: nextProfile.full_name || "",
      location: nextProfile.location || "",
      bio: nextProfile.bio || "",
      phone: nextProfile.phone || "",
    });
    toast.success("Perfil actualizado.");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 text-center text-muted-foreground">Cargando perfil...</section>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 md:py-28 text-center">
          <h1 className="font-serif text-3xl md:text-5xl mb-4">Editar perfil</h1>
          <p className="text-muted-foreground mb-8">Inicia sesión para editar tu perfil público.</p>
          <Link to="/auth" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-deep transition-smooth">
            Entrar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-cream">
      <section className="container max-w-3xl py-12 md:py-20">
        <div className="mb-8">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Cuenta</span>
          <h1 className="font-serif text-3xl md:text-5xl mt-3">Editar perfil</h1>
        </div>

        <form onSubmit={onSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-soft space-y-5">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre público</Label>
            <Input id="full_name" name="full_name" defaultValue={profile.full_name} maxLength={120} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input id="location" name="location" defaultValue={profile.location} maxLength={120} placeholder="Sevilla, Jerez..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono o WhatsApp</Label>
            <Input id="phone" name="phone" defaultValue={profile.phone} type="tel" maxLength={40} placeholder="+34 600 000 000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio / sobre mí</Label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={profile.bio}
              rows={5}
              maxLength={500}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              placeholder="Cuéntale a las compradoras quién eres, de dónde eres o qué tipo de prendas sueles vender."
            />
          </div>

          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Guardar perfil
          </Button>
        </form>
      </section>
    </main>
  );
};

export default EditProfile;
