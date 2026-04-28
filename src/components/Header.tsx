import { LogOut, Menu, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentUserAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/#vender", label: "Vender" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#tiendas", label: "Para tiendas" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadUnreadCount = async (userId?: string) => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const db = supabase as any;
    const { data: conversations, error: conversationsError } = await db
      .from("conversations")
      .select("id")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (conversationsError) {
      setUnreadCount(0);
      return;
    }

    const conversationIds = (conversations || []).map((conversation: { id: string }) => conversation.id);
    if (conversationIds.length === 0) {
      setUnreadCount(0);
      return;
    }

    const { count, error } = await db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error) {
      setUnreadCount(0);
      return;
    }

    setUnreadCount(count || 0);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadUnreadCount(data.session?.user.id);
      getCurrentUserAdmin().then((result) => setIsAdmin(result.isAdmin));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      loadUnreadCount(currentSession?.user.id);
      if (currentSession?.user.id) {
        getCurrentUserAdmin().then((result) => setIsAdmin(result.isAdmin));
      } else {
        setIsAdmin(false);
      }
    });

    const onMessagesRead = () => loadUnreadCount(session?.user.id);
    window.addEventListener("faralaes:messages-read", onMessagesRead);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("faralaes:messages-read", onMessagesRead);
    };
  }, [session?.user.id]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Sesión cerrada.");
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex flex-col justify-center leading-none">
          <span className="font-serif text-2xl md:text-3xl italic font-semibold text-foreground">
            Farala<span className="text-primary">es</span>
          </span>
          <span className="hidden sm:block mt-1 text-[10px] md:text-xs font-medium uppercase tracking-[0.12em] text-foreground/55">
            Compraventa de moda flamenca
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/80 hover:text-primary transition-smooth">
              {l.label}
            </a>
          ))}
          {session ? (
            <>
              <Link to="/perfil" className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-smooth">
                Perfil
              </Link>
              <Link to="/mensajes" className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-smooth">
                Mensajes
                {unreadCount > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] leading-5 text-center font-semibold">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/favoritos" className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-smooth">
                Favoritos
              </Link>
              <Link to="/mis-anuncios" className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-smooth">
                Mis anuncios
              </Link>
              {isAdmin && (
                <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-smooth">
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-smooth"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-primary transition-smooth"
            >
              <User className="w-4 h-4" />
              Entrar
            </Link>
          )}
          <a href="/#vender" className="px-5 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-primary transition-smooth">
            Vender prenda
          </a>
        </nav>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2" aria-label="Menú">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background animate-fade-in">
          <nav className="container py-4 flex flex-col gap-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-base font-medium py-2">
                {l.label}
              </a>
            ))}
            {session ? (
              <>
                <Link to="/perfil" onClick={() => setOpen(false)} className="text-base font-medium py-2">
                  Perfil
                </Link>
                <Link to="/mensajes" onClick={() => setOpen(false)} className="text-base font-medium py-2">
                  <span className="inline-flex items-center gap-2">
                    Mensajes
                    {unreadCount > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] leading-5 text-center font-semibold">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                </Link>
                <Link to="/favoritos" onClick={() => setOpen(false)} className="text-base font-medium py-2">
                  Favoritos
                </Link>
                <Link to="/mis-anuncios" onClick={() => setOpen(false)} className="text-base font-medium py-2">
                  Mis anuncios
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="text-base font-medium py-2">
                    Admin
                  </Link>
                )}
                <button type="button" onClick={signOut} className="text-base font-medium py-2 text-left">
                  Salir
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="text-base font-medium py-2">
                Entrar
              </Link>
            )}
            <a href="/#vender" onClick={() => setOpen(false)} className="px-5 py-3 rounded-full bg-foreground text-background text-center font-medium">
              Vender prenda
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};
