import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import NavBar from "../components/NavBar";
import AccountBadges from "../components/AccountBadges";
import UserAvatar from "../components/UserAvatar";
import { formatPrice } from "../lib/formatPrice";
import { useAuth } from "../lib/authContext";

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
};

type Conversation = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  buyer: User;
  seller: User;
  listing: {
    id: string;
    title: string;
    priceCents: number;
    images?: {
      url: string;
    }[];
  };
  messages: Message[];
};

type User = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  accountType?: string | null;
  verified?: boolean | null;
};

const getLastMessage = (conversation: Conversation) =>
  conversation.messages[conversation.messages.length - 1];

const getConversationTimestamp = (conversation: Conversation) => {
  const lastMessage = getLastMessage(conversation);

  return lastMessage ? new Date(lastMessage.createdAt).getTime() : 0;
};

const formatMessageDate = (date: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

const formatShortTime = (date: string) =>
  new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

const getOwnMessageStatus = (message: Message) => {
  if (message.failed) {
    return "No enviado";
  }

  if (message.pending) {
    return "Enviando...";
  }

  return message.readAt ? "Leído" : "Enviado";
};

const sortConversations = (conversations: Conversation[]) =>
  [...conversations].sort(
    (a, b) => getConversationTimestamp(b) - getConversationTimestamp(a)
  );

const getOtherUser = (conversation: Conversation, userId: string) =>
  conversation.buyerId === userId ? conversation.seller : conversation.buyer;

const getDisplayName = (user: User) => user.displayName || `@${user.username}`;

const openUserProfile = (
  router: ReturnType<typeof useRouter>,
  user: User
) => {
  router.push(`/usuario/${user.username}`);
};

const getRoleLabel = (conversation: Conversation, userId: string) =>
  conversation.buyerId === userId ? "Comprador" : "Vendedor";

const conversationsEqual = (a: Conversation[], b: Conversation[]) =>
  JSON.stringify(a) === JSON.stringify(b);

export default function Mensajes() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [userId, setUserId] = useState("");
  const [conversaciones, setConversaciones] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const lastScrolledConversationIdRef = useRef("");
  const lastScrolledMessageCountRef = useRef(0);
  const markingReadConversationIdRef = useRef("");

  const isNearBottom = () => {
    const container = messagesContainerRef.current;

    if (!container) {
      return true;
    }

    return (
      container.scrollHeight - container.scrollTop - container.clientHeight < 120
    );
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  const mergeConversations = (incoming: Conversation[]) => {
    setConversaciones((prev) => {
      const prevById = new Map(prev.map((conversation) => [conversation.id, conversation]));
      const merged = incoming.map((conversation) => {
        const current = prevById.get(conversation.id);

        if (!current) {
          return conversation;
        }

        const pendingMessages = current.messages.filter(
          (message) => message.pending || message.failed
        );
        const incomingIds = new Set(conversation.messages.map((message) => message.id));

        return {
          ...conversation,
          messages: [
            ...conversation.messages,
            ...pendingMessages.filter((message) => !incomingIds.has(message.id)),
          ],
        };
      });
      const sorted = sortConversations(merged);

      return conversationsEqual(prev, sorted) ? prev : sorted;
    });
  };

  useLayoutEffect(() => {
    if (!router.isReady || authLoading) {
      return;
    }

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    let active = true;
    const currentUserId = user.id;
    setUserId(currentUserId);
    setLoading(true);

    const cargarConversaciones = (initial = false) => {
      fetch("/api/conversaciones")
        .then((res) => {
          if (res.status === 401) {
            router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
            return null;
          }

          if (!res.ok) {
            throw new Error("No se han podido cargar tus mensajes.");
          }

          return res.json();
        })
        .then((data: Conversation[] | null) => {
          if (!data || !active) {
            return;
          }

          const conversacionesOrdenadas = sortConversations(data);
          mergeConversations(conversacionesOrdenadas);
          setError("");

          if (!initial) {
            return;
          }

          const queryId =
            typeof router.query.conversationId === "string"
              ? router.query.conversationId
              : "";
          setSelectedId(queryId || conversacionesOrdenadas[0]?.id || "");
        })
        .catch((err: Error) => {
          if (!active) {
            return;
          }

          setError(err.message || "No se han podido cargar tus mensajes.");
        })
        .finally(() => {
          if (initial && active) {
            setLoading(false);
          }
        });
    };

    cargarConversaciones(true);

    const intervalId = window.setInterval(() => {
      if (currentUserId) {
        cargarConversaciones(false);
      }
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [
    authLoading,
    router,
    router.asPath,
    router.isReady,
    router.query.conversationId,
    user,
  ]);

  const conversacionSeleccionada = useMemo(
    () => conversaciones.find((conversacion) => conversacion.id === selectedId),
    [conversaciones, selectedId]
  );

  useEffect(() => {
    if (!conversacionSeleccionada) {
      return;
    }

    const messageCount = conversacionSeleccionada.messages.length;
    const conversationChanged =
      lastScrolledConversationIdRef.current !== conversacionSeleccionada.id;
    const hasNewMessages = messageCount > lastScrolledMessageCountRef.current;

    if (conversationChanged) {
      shouldStickToBottomRef.current = true;
      lastScrolledConversationIdRef.current = conversacionSeleccionada.id;
      lastScrolledMessageCountRef.current = messageCount;
      requestAnimationFrame(() => scrollToBottom("auto"));
      return;
    }

    lastScrolledMessageCountRef.current = messageCount;

    if (hasNewMessages && shouldStickToBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [conversacionSeleccionada?.id, conversacionSeleccionada?.messages.length]);

  useEffect(() => {
    if (!conversacionSeleccionada || !userId) {
      return;
    }

    const hasUnreadReceivedMessages = conversacionSeleccionada.messages.some(
      (message) => message.receiverId === userId && !message.readAt
    );

    if (!hasUnreadReceivedMessages) {
      return;
    }

    if (markingReadConversationIdRef.current === conversacionSeleccionada.id) {
      return;
    }

    let active = true;
    markingReadConversationIdRef.current = conversacionSeleccionada.id;

    fetch("/api/mensajes/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: conversacionSeleccionada.id }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se han podido marcar los mensajes como leidos.");
        }

        return res.json();
      })
      .then(
        (data: {
          readAt?: string;
          unreadCount?: number;
        }) => {
          if (!active || !data.readAt) {
            return;
          }

          setConversaciones((prev) =>
            prev.map((conversacion) =>
              conversacion.id === conversacionSeleccionada.id
                ? {
                    ...conversacion,
                    messages: conversacion.messages.map((message) =>
                      message.receiverId === userId && !message.readAt
                        ? { ...message, readAt: data.readAt as string }
                        : message
                    ),
                  }
                : conversacion
            )
          );

          window.dispatchEvent(
            new CustomEvent("faralaes:unread-messages-changed", {
              detail: { count: data.unreadCount },
            })
          );
        }
      )
      .catch(() => null)
      .finally(() => {
        if (markingReadConversationIdRef.current === conversacionSeleccionada.id) {
          markingReadConversationIdRef.current = "";
        }
      });

    return () => {
      active = false;
    };
  }, [
    conversacionSeleccionada?.id,
    conversacionSeleccionada?.messages,
    userId,
  ]);

  const seleccionarConversacion = (id: string) => {
    setSelectedId(id);
    router.push(`/mensajes?conversationId=${id}`, undefined, {
      shallow: true,
    });
  };

  const enviarMensaje = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!body.trim() || !conversacionSeleccionada) {
      return;
    }

    const texto = body.trim();
    const tempId = `temp-${Date.now()}`;
    const mensajeTemporal: Message = {
      id: tempId,
      conversationId: conversacionSeleccionada.id,
      senderId: userId,
      receiverId:
        conversacionSeleccionada.buyerId === userId
          ? conversacionSeleccionada.sellerId
          : conversacionSeleccionada.buyerId,
      body: texto,
      readAt: null,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    shouldStickToBottomRef.current = true;
    setBody("");
    setSending(true);
    setConversaciones((prev) =>
      prev.map((conversacion) =>
        conversacion.id === conversacionSeleccionada.id
          ? {
              ...conversacion,
              messages: [...conversacion.messages, mensajeTemporal],
            }
          : conversacion
      )
    );

    const res = await fetch("/api/mensajes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conversacionSeleccionada.id,
        body: texto,
      }),
    });

    if (!res.ok) {
      setConversaciones((prev) =>
        prev.map((conversacion) =>
          conversacion.id === conversacionSeleccionada.id
            ? {
                ...conversacion,
                messages: conversacion.messages.map((message) =>
                  message.id === tempId
                    ? { ...message, pending: false, failed: true }
                    : message
                ),
              }
            : conversacion
        )
      );
      setError("No se ha podido enviar el mensaje.");
      setSending(false);
      return;
    }

    const nuevoMensaje: Message = await res.json();
    setConversaciones((prev) =>
      prev.map((conversacion) =>
        conversacion.id === nuevoMensaje.conversationId
          ? {
              ...conversacion,
              messages: conversacion.messages.map((message) =>
                message.id === tempId ? nuevoMensaje : message
              ),
            }
          : conversacion
      )
    );
    setSending(false);
    setError("");
  };

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-[#f8f3ef] px-6 py-12">
        <section className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
            Mensajes
          </p>
          <h1 className="mb-8 mt-3 font-serif text-4xl md:text-5xl">
            Conversaciones
          </h1>

          {loading && <p>Cargando mensajes...</p>}

          {!loading && error && <p className="mb-4 text-red-700">{error}</p>}

          {!loading && conversaciones.length === 0 && (
            <p>No tienes conversaciones todavía.</p>
          )}

          {!loading && conversaciones.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <aside className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {conversaciones.map((conversacion) => {
                  const lastMessage = getLastMessage(conversacion);
                  const otherUser = getOtherUser(conversacion, userId);
                  const roleLabel = getRoleLabel(conversacion, userId);

                  return (
                    <button
                      type="button"
                      key={conversacion.id}
                      onClick={() => seleccionarConversacion(conversacion.id)}
                      className={`block w-full border-b border-gray-100 p-4 text-left transition last:border-b-0 ${
                        selectedId === conversacion.id
                          ? "bg-green-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-gray-950">
                          {conversacion.listing.title}
                        </p>
                        {lastMessage && (
                          <p className="whitespace-nowrap text-xs text-gray-400">
                            {formatMessageDate(lastMessage.createdAt)}
                          </p>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-red-700">
                        {formatPrice(conversacion.listing.priceCents)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                          {roleLabel}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openUserProfile(router, otherUser);
                          }}
                          className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-green-700"
                        >
                          <UserAvatar
                            user={otherUser}
                            size="xs"
                            expandable
                            imageAlt={getDisplayName(otherUser)}
                          />
                          <span className="truncate">Con: {getDisplayName(otherUser)}</span>
                        </button>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                        {lastMessage
                          ? lastMessage.body
                          : "Sin mensajes todavía"}
                      </p>
                    </button>
                  );
                })}
              </aside>

              <section className="flex h-[640px] min-h-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
                {conversacionSeleccionada && (
                  <>
                    <div className="border-b border-gray-100 p-5">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/producto/${conversacionSeleccionada.listing.id}`
                            )
                          }
                          className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-gray-200"
                          aria-label="Abrir anuncio"
                        >
                          {conversacionSeleccionada.listing.images?.[0]?.url ? (
                            <img
                              src={conversacionSeleccionada.listing.images[0].url}
                              alt={conversacionSeleccionada.listing.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center px-1 text-center text-[11px] text-gray-500">
                              Sin imagen
                            </span>
                          )}
                        </button>

                        <div>
                          <p className="text-sm text-gray-500">Anuncio</p>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/producto/${conversacionSeleccionada.listing.id}`
                              )
                            }
                            className="text-left font-serif text-2xl text-gray-950 transition hover:text-green-700"
                          >
                            {conversacionSeleccionada.listing.title}
                          </button>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
                              {getRoleLabel(conversacionSeleccionada, userId)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                openUserProfile(
                                  router,
                                  getOtherUser(conversacionSeleccionada, userId)
                                )
                              }
                              className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-green-700"
                            >
                              <UserAvatar
                                user={getOtherUser(conversacionSeleccionada, userId)}
                                size="xs"
                                expandable
                                imageAlt={getDisplayName(
                                  getOtherUser(conversacionSeleccionada, userId)
                                )}
                              />
                              <span className="truncate">
                                Con:{" "}
                                {getDisplayName(
                                  getOtherUser(conversacionSeleccionada, userId)
                                )}
                              </span>
                            </button>
                            <AccountBadges
                              user={getOtherUser(conversacionSeleccionada, userId)}
                              compact
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      ref={messagesContainerRef}
                      onScroll={() => {
                        shouldStickToBottomRef.current = isNearBottom();
                      }}
                      className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5"
                    >
                      {conversacionSeleccionada.messages.length === 0 && (
                        <p className="text-gray-500">
                          Todavía no hay mensajes en esta conversación.
                        </p>
                      )}

                      {conversacionSeleccionada.messages.map((message) => {
                        const propio = message.senderId === userId;
                        const messageUser = propio
                          ? {
                              displayName: user?.displayName || "",
                              username: user?.username || "",
                              avatarUrl: user?.avatarUrl || null,
                            }
                          : getOtherUser(conversacionSeleccionada, userId);
                        const messageUserName =
                          messageUser.displayName ||
                          (messageUser.username ? `@${messageUser.username}` : "Avatar");

                        return (
                          <div
                            key={message.id}
                            className={`flex items-end gap-2 ${
                              propio ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!propio && (
                              <UserAvatar
                                user={messageUser}
                                size="xs"
                                expandable
                                imageAlt={messageUserName}
                              />
                            )}
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                                propio
                                  ? "bg-green-700 text-white"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <p>{message.body}</p>
                              <div
                                className={`mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-tight ${
                                  propio ? "justify-end text-green-100" : "text-gray-500"
                                }`}
                              >
                                <span>{formatShortTime(message.createdAt)}</span>
                                {propio && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>{getOwnMessageStatus(message)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {propio && (
                              <UserAvatar
                                user={messageUser}
                                size="xs"
                                expandable
                                imageAlt={messageUserName}
                              />
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <form
                      onSubmit={enviarMensaje}
                      className="shrink-0 flex gap-3 border-t border-gray-100 p-5"
                    >
                      <input
                        className="flex-1 rounded-full border border-gray-300 px-4 py-3 outline-none transition focus:border-green-700"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Escribe un mensaje"
                      />
                      <button
                        type="submit"
                        disabled={sending}
                        className="rounded-full bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                      >
                        {sending ? "Enviando..." : "Enviar"}
                      </button>
                    </form>
                  </>
                )}
              </section>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
