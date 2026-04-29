import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const heroImg = "/hero-flamenca.webp";

type LatestListing = {
  title: string;
  location: string | null;
  listing_images?: ListingImage[];
};

type ListingImage = {
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

export const Hero = () => {
  const [latestListing, setLatestListing] = useState<LatestListing | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string>(heroImg);

  useEffect(() => {
    const loadLatestListing = async () => {
      const { data, error } = await (supabase as any)
        .from("listings")
        .select("title,location,listing_images(storage_path,alt_text,sort_order)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setLatestListing(null);
        return;
      }

      const row = data as LatestListing;
      if (!row.title) {
        setLatestListing(null);
        return;
      }

      setLatestListing(row);

      const firstImage = [...(row.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0];
      if (!firstImage?.storage_path) {
        setHeroImageUrl(heroImg);
        return;
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from("listing-images")
        .createSignedUrl(firstImage.storage_path, 60 * 60);

      if (signedError || !signedData?.signedUrl) {
        setHeroImageUrl(heroImg);
        return;
      }

      setHeroImageUrl(signedData.signedUrl);
    };

    loadLatestListing();
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-cream">
      <div className="container py-12 md:py-24 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="animate-fade-up order-2 md:order-1">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" /> El primer marketplace de moda flamenca
          </span>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.05] text-foreground text-balance mb-6">
            Compra y vende ropa flamenca <em className="text-primary not-italic md:italic">sin complicarte</em>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl text-balance">
            Trajes, faldas, blusas, mantones, flores, zapatos y complementos flamencos en un solo lugar. Hecho por y para flamencas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="#vender" className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-primary text-primary-foreground font-medium shadow-coral hover:bg-primary-deep transition-smooth">
              Quiero vender mi traje
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-smooth" />
            </a>
            <a href="#catalogo" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-foreground text-background font-medium hover:bg-foreground/85 transition-smooth">
              Quiero ver el catálogo
            </a>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-10 pt-8 border-t border-border/60">
            <div>
              <div className="font-serif text-xl md:text-2xl text-foreground">Nuevos anuncios cada día</div>
            </div>
            <div>
              <div className="font-serif text-xl md:text-2xl text-foreground">Contacto directo con el vendedor</div>
            </div>
          </div>
        </div>

        <div className="relative order-1 md:order-2">
          <div className="absolute -inset-4 bg-gradient-coral opacity-20 blur-3xl rounded-full" />
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-soft">
            <img src={heroImageUrl} alt={latestListing?.title || "Traje de flamenca granate con lunares blancos"} width={1080} height={1350} className="w-full h-full object-cover" />
          </div>
          {latestListing && (
            <div className="hidden md:block absolute -bottom-6 -left-6 bg-card rounded-2xl px-5 py-4 shadow-soft animate-float max-w-[260px]">
              <div className="text-xs text-muted-foreground">Última publicada</div>
              <div className="font-serif text-lg line-clamp-2">
                {latestListing.title}{latestListing.location ? ` · ${latestListing.location}` : ""}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
