import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Send } from "lucide-react";
import { toast } from "sonner";
import placeholderImage from "@/assets/product-traje-coral.jpg";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
};

type Listing = {
  id: string;
  title: string;
  price_cents: number;
  listing_images?: ListingImage[];
};

type ListingImage = {
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type ConversationView = Conversation & {
  otherUserName: string;
  listingTitle: string;
  listingPriceCents: number | null;
  listingImageUrl: string;
  lastMessage: string;
  lastMessageAt: string | null;
  hasUnread: boolean;
};

const quickReplies = [
  "¿Sigue disponible?",
  "¿Podrías enviarme más fotos?",
  "¿Dónde se puede recoger?",
];

const formatPrice = (priceCents: number | null) =>
  priceCents === null ? "Sin precio" : `${Math.round(priceCents / 100)}€`;

const formatConversationTime = (date: string | null) => {
  if (!date) return "";

  return new Date(date).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeMessage = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

const Messages = () => {
  const location = useLocation();
  const requestedConversationId = (location.state as { conversationId?: string } | null)?.conversationId;
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(requestedConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedIdRef = useRef<string | null>(selectedId);
  const userIdRef = useRef<string | null>(userId);
  const conversationIdsRef = useRef<Set<string>>(new Set());

  const db = supabase as any;

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || null,
    [conversations, selectedId]
  );

  const applyQuickReply = (reply: string) => {
    setMessageDraft((current) => (normalizeMessage(current) === normalizeMessage(reply) ? current : reply));
  };

  const sortConversations = (items: ConversationView[]) =>
    [...items].sort(
      (a, b) =>
        new Date(b.lastMessageAt || b.updated_at).getTime() -
        new Date(a.lastMessageAt || a.updated_at).getTime()
    );

  const updateConversationPreview = (message: Message, markUnread: boolean) => {
    setConversations((current) =>
      sortConversations(
        current.map((conversation) =>
          conversation.id === message.conversation_id
            ? {
                ...conversation,
                lastMessage: message.body,
                lastMessageAt: message.created_at,
                hasUnread: markUnread ? true : conversation.hasUnread,
                last_message_at: message.created_at,
                updated_at: message.created_at,
              }
            : conversation
        )
      )
    );
  };

  const loadConversations = async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setUserId(null);
      setConversations([]);
      setLoading(false);
      return;
    }

    setUserId(userData.user.id);

    const { data, error } = await db
      .from("conversations")
      .select("id,listing_id,buyer_id,seller_id,last_message_at,created_at,updated_at")
      .or(`buyer_id.eq.${userData.user.id},seller_id.eq.${userData.user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const rows = (data || []) as Conversation[];
    const profileIds = Array.from(new Set(rows.flatMap((conversation) => [conversation.buyer_id, conversation.seller_id])));
    const listingIds = Array.from(new Set(rows.map((conversation) => conversation.listing_id)));
    const conversationIds = rows.map((conversation) => conversation.id);
    const imageUrls = new Map<string, string>();

    const profiles = new Map<string, Profile>();
    if (profileIds.length > 0) {
      const { data: profilesData, error: profilesError } = await db
        .from("profiles")
        .select("id,username,full_name")
        .in("id", profileIds);

      if (profilesError) {
        toast.error(profilesError.message);
      } else {
        (profilesData || []).forEach((profile: Profile) => profiles.set(profile.id, profile));
      }
    }

    const listings = new Map<string, Listing>();
    if (listingIds.length > 0) {
      const { data: listingsData, error: listingsError } = await db
        .from("listings")
        .select("id,title,price_cents,listing_images(storage_path,alt_text,sort_order)")
        .in("id", listingIds);

      if (listingsError) {
        toast.error(listingsError.message);
      } else {
        (listingsData || []).forEach((listing: Listing) => listings.set(listing.id, listing));
      }
    }

    const lastMessages = new Map<string, { body: string; created_at: string }>();
    const unreadConversations = new Set<string>();
    if (conversationIds.length > 0) {
      const { data: messagesData, error: messagesError } = await db
        .from("messages")
        .select("conversation_id,sender_id,body,read_at,created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      if (messagesError) {
        toast.error(messagesError.message);
      } else {
        (messagesData || []).forEach((message: Pick<Message, "conversation_id" | "sender_id" | "body" | "read_at" | "created_at">) => {
          if (!lastMessages.has(message.conversation_id)) {
            lastMessages.set(message.conversation_id, { body: message.body, created_at: message.created_at });
          }
          if (message.sender_id !== userData.user.id && !message.read_at) {
            unreadConversations.add(message.conversation_id);
          }
        });
      }
    }

    const firstImagePaths = Array.from(listings.values())
      .map((listing) => [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path)
      .filter(Boolean) as string[];

    if (firstImagePaths.length > 0) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from("listing-images")
        .createSignedUrls(firstImagePaths, 60 * 60);

      if (signedError) {
        toast.error(signedError.message);
      } else {
        signedData?.forEach((signed) => {
          if (signed.path && signed.signedUrl) {
            imageUrls.set(signed.path, signed.signedUrl);
          }
        });
      }
    }

    const mapped = rows.map((conversation) => {
      const otherUserId = conversation.buyer_id === userData.user.id ? conversation.seller_id : conversation.buyer_id;
      const otherUser = profiles.get(otherUserId);
      const listing = listings.get(conversation.listing_id);
      const firstImage = listing
        ? [...(listing.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order)[0]
        : undefined;
      const lastMessage = lastMessages.get(conversation.id);

      return {
        ...conversation,
        otherUserName: otherUser?.full_name || otherUser?.username || "Usuario de Faralaes",
        listingTitle: listing?.title || "Anuncio",
        listingPriceCents: listing?.price_cents ?? null,
        listingImageUrl: firstImage ? imageUrls.get(firstImage.storage_path) || placeholderImage : placeholderImage,
        lastMessage: lastMessage?.body || "Sin mensajes todavía",
        lastMessageAt: lastMessage?.created_at || conversation.last_message_at || conversation.updated_at || conversation.created_at,
        hasUnread: unreadConversations.has(conversation.id),
      };
    });

    setConversations(sortConversations(mapped));
    setSelectedId((current) => current || requestedConversationId || mapped[0]?.id || null);
    setLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await db
      .from("messages")
      .select("id,conversation_id,sender_id,body,read_at,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error(error.message);
      return;
    }

    setMessages((data || []) as Message[]);
  };

  const markConversationAsRead = async (conversationId: string, currentUserId: string) => {
    const { error } = await db
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId)
      .is("read_at", null);

    if (error) {
      toast.error(error.message);
      return;
    }

    window.dispatchEvent(new Event("faralaes:messages-read"));
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, hasUnread: false } : conversation
      )
    );
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    conversationIdsRef.current = new Set(conversations.map((conversation) => conversation.id));
  }, [conversations]);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
      if (userId) {
        markConversationAsRead(selectedId, userId);
      }
    } else {
      setMessages([]);
    }
  }, [selectedId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, selectedId]);

  useEffect(() => {
    if (!userId || conversations.length === 0) return;

    const channel = supabase
      .channel(`messages-realtime-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const message = payload.new as Message;

          if (!conversationIdsRef.current.has(message.conversation_id)) {
            return;
          }

          const activeConversationId = selectedIdRef.current;
          const currentUserId = userIdRef.current;
          const isActiveConversation = message.conversation_id === activeConversationId;
          const isOwnMessage = message.sender_id === currentUserId;

          if (isActiveConversation) {
            setMessages((current) => {
              if (current.some((item) => item.id === message.id)) {
                return current;
              }

              return [...current, message].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          }

          updateConversationPreview(message, !isOwnMessage && !isActiveConversation);

          if (!isOwnMessage && isActiveConversation && currentUserId) {
            markConversationAsRead(message.conversation_id, currentUserId);
          }

          if (!isOwnMessage && !isActiveConversation) {
            window.dispatchEvent(new Event("faralaes:messages-read"));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const message = payload.new as Message;

          if (!conversationIdsRef.current.has(message.conversation_id)) {
            return;
          }

          setMessages((current) =>
            current.map((item) => (item.id === message.id ? { ...item, read_at: message.read_at } : item))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, conversations.length]);

  const sendMessageBody = async (body: string) => {
    if (!userId || !selectedId) return;

    const trimmedBody = body.trim();

    if (!trimmedBody) {
      toast.error("Escribe un mensaje.");
      return;
    }

    setSending(true);

    const { data, error } = await db
      .from("messages")
      .insert({
        conversation_id: selectedId,
        sender_id: userId,
        body: trimmedBody,
      })
      .select("id,conversation_id,sender_id,body,read_at,created_at")
      .single();

    setSending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setMessageDraft("");
    if (data) {
      const insertedMessage = data as Message;

      setMessages((current) => {
        if (current.some((message) => message.id === insertedMessage.id)) {
          return current;
        }

        return [...current, insertedMessage].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      updateConversationPreview(insertedMessage, false);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await sendMessageBody(messageDraft);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 text-center text-muted-foreground">Cargando mensajes...</section>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-16 md:py-28 text-center">
          <h1 className="font-serif text-3xl md:text-5xl mb-4">Mensajes</h1>
          <p className="text-muted-foreground mb-8">Inicia sesión para ver tus conversaciones.</p>
          <Link to="/auth" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-deep transition-smooth">
            Entrar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-10 md:py-16">
        <div className="mb-8">
          <span className="text-primary text-sm font-medium uppercase tracking-widest">Bandeja</span>
          <h1 className="font-serif text-3xl md:text-5xl mt-3">Mensajes</h1>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Todavía no tienes conversaciones.
          </div>
        ) : (
          <div className="grid lg:grid-cols-[360px_1fr] gap-6">
            <aside className="bg-card border border-border rounded-2xl overflow-hidden">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full text-left p-4 border-b border-border/60 last:border-b-0 transition-smooth ${
                    selectedId === conversation.id
                      ? "bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]"
                      : conversation.hasUnread
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60">
                      <img src={conversation.listingImageUrl} alt={conversation.listingTitle} className="h-full w-full object-cover" />
                      {conversation.hasUnread && (
                        <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground line-clamp-1">{conversation.otherUserName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{conversation.listingTitle}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatConversationTime(conversation.lastMessageAt)}</span>
                          {conversation.hasUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                      </div>
                      <div className={`text-sm mt-2 line-clamp-2 ${conversation.hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {conversation.lastMessage}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </aside>

            <section className="bg-card border border-border rounded-2xl overflow-hidden min-h-[560px] flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-4 md:p-5 border-b border-border/60 bg-background/70">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-14 overflow-hidden rounded-xl bg-muted border border-border/60 shrink-0">
                        <img src={selectedConversation.listingImageUrl} alt={selectedConversation.listingTitle} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-serif text-xl md:text-2xl line-clamp-1">{selectedConversation.listingTitle}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatPrice(selectedConversation.listingPriceCents)} · {selectedConversation.otherUserName}
                        </div>
                      </div>
                      <Link
                        to={`/producto/${selectedConversation.listing_id}`}
                        className="hidden sm:inline-flex px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/85 transition-smooth"
                      >
                        Ver anuncio
                      </Link>
                    </div>
                    <Link
                      to={`/producto/${selectedConversation.listing_id}`}
                      className="sm:hidden mt-3 inline-flex w-full justify-center px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/85 transition-smooth"
                    >
                      Ver anuncio
                    </Link>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[480px]">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-16">
                        Aún no hay mensajes. Escribe el primero.
                      </div>
                    ) : (
                      messages.map((message) => {
                        const own = message.sender_id === userId;

                        return (
                          <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                own
                                  ? "rounded-br-md bg-[#E8F5E9] text-[#1f2d1f]"
                                  : "rounded-bl-md bg-muted/80 text-foreground"
                              }`}
                            >
                              <p className="whitespace-pre-line">{message.body}</p>
                              <div className={`flex items-center gap-1.5 text-[11px] mt-2 ${own ? "justify-end text-[#4f684f]" : "text-muted-foreground"}`}>
                                <span>
                                  {new Date(message.created_at).toLocaleString("es-ES", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {own && (
                                  <span className={message.read_at ? "text-[#3B82F6]" : "text-[#6b7280]"} title={message.read_at ? "Leído" : "Enviado"}>
                                    {message.read_at ? "✓✓" : "✓"}
                                  </span>
                                )}
                                {own && message.read_at && <span className="sr-only">Leído</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-border/60 p-4">
                    {messageDraft.trim() && (
                      <div className="mb-2 text-xs text-muted-foreground">Escribiendo...</div>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {quickReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => applyQuickReply(reply)}
                          className="rounded-full border border-[#2E7D32] bg-background px-3 py-1.5 text-xs font-medium text-[#2E7D32] hover:bg-[#E8F5E9] transition-smooth"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                    <form onSubmit={sendMessage} className="flex gap-3">
                      <input
                        name="body"
                        value={messageDraft}
                        onChange={(event) => setMessageDraft(event.target.value)}
                        placeholder="Escribe un mensaje"
                        maxLength={2000}
                        className="flex-1 rounded-full border border-input bg-background px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                      />
                      <Button type="submit" disabled={sending} className="rounded-full bg-[#2E7D32] text-white hover:bg-[#1B5E20]">
                        <Send className="w-4 h-4" />
                        Enviar
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  Selecciona una conversación.
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
};

export default Messages;
