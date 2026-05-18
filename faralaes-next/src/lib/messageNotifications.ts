import { getAppBaseUrl } from "./emailVerification";
import { createMailTransporter, escapeHtml, getRequiredMailEnv } from "./mail";
import { prisma } from "./prisma";

const MESSAGE_NOTIFICATION_WINDOW_MS = 10 * 60 * 1000;
const MESSAGE_PREVIEW_LENGTH = 180;

type SendMessageNotificationEmailArgs = {
  conversationId: string;
  senderId: string;
  receiverId: string;
  body: string;
  req?: {
    headers?: {
      host?: string;
    };
  };
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const truncatePreview = (value: string) => {
  const normalized = normalizeWhitespace(value);

  if (normalized.length <= MESSAGE_PREVIEW_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MESSAGE_PREVIEW_LENGTH - 1).trimEnd()}...`;
};

const getDisplayName = (user: { displayName?: string | null; username?: string | null }) =>
  user.displayName?.trim() || (user.username ? `@${user.username}` : "");

const buildReplyUrl = (baseUrl: string, conversationId: string) =>
  `${baseUrl}/mensajes?conversationId=${encodeURIComponent(conversationId)}`;

export const sendMessageNotificationEmail = async ({
  conversationId,
  senderId,
  receiverId,
  body,
  req,
}: SendMessageNotificationEmailArgs) => {
  const now = new Date();
  const throttleThreshold = new Date(now.getTime() - MESSAGE_NOTIFICATION_WINDOW_MS);

  const lastNotification = await prisma.messageEmailNotification.findUnique({
    where: {
      conversationId_receiverId: {
        conversationId,
        receiverId,
      },
    },
    select: {
      lastSentAt: true,
    },
  });

  if (lastNotification && lastNotification.lastSentAt > throttleThreshold) {
    console.log("[message-email] skipped by throttle", {
      conversationId,
      receiverId,
      lastSentAt: lastNotification.lastSentAt.toISOString(),
    });
    return;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      listing: {
        select: {
          title: true,
        },
      },
      buyer: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
      seller: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  if (!conversation) {
    console.warn("[message-email] conversation not found", { conversationId });
    return;
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!receiver) {
    console.warn("[message-email] receiver not found", { conversationId, receiverId });
    return;
  }

  const sender =
    conversation.buyer.id === senderId ? conversation.buyer : conversation.seller;
  const senderName = getDisplayName(sender);
  const listingTitle = conversation.listing.title?.trim() || "";
  const preview = truncatePreview(body);
  const baseUrl = getAppBaseUrl(req).replace(/\/$/, "");
  const replyUrl = buildReplyUrl(baseUrl, conversationId);
  const safeReplyUrl = escapeHtml(replyUrl);
  const safeSenderName = senderName ? escapeHtml(senderName) : "";
  const safeListingTitle = listingTitle ? escapeHtml(listingTitle) : "";
  const safePreview = escapeHtml(preview);
  const { fromEmail, fromName } = getRequiredMailEnv();
  const transporter = createMailTransporter();

  console.log("[message-email] sending", {
    conversationId,
    senderId,
    receiverId,
  });

  await transporter.sendMail({
    from: {
      name: fromName,
      address: fromEmail,
    },
    to: receiver.email,
    subject: "Tienes un nuevo mensaje en Faralaes",
    text: [
      "Tienes un nuevo mensaje en Faralaes",
      "",
      senderName ? `Remitente: ${senderName}` : "",
      listingTitle ? `Anuncio: ${listingTitle}` : "",
      "",
      "Vista previa:",
      preview,
      "",
      "Responde dentro de Faralaes:",
      replyUrl,
    ]
      .filter((line) => line !== "")
      .join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #241f1c;">
        <h2 style="margin: 0 0 16px;">Tienes un nuevo mensaje en Faralaes</h2>
        ${
          safeSenderName
            ? `<p style="margin: 0 0 8px;"><strong>Remitente:</strong> ${safeSenderName}</p>`
            : ""
        }
        ${
          safeListingTitle
            ? `<p style="margin: 0 0 16px;"><strong>Anuncio:</strong> ${safeListingTitle}</p>`
            : ""
        }
        <div style="margin: 18px 0; padding: 14px 16px; border-left: 4px solid #15803d; background: #f6f7f3;">
          <strong>Vista previa:</strong>
          <p style="margin: 8px 0 0;">${safePreview}</p>
        </div>
        <p>
          <a href="${safeReplyUrl}" style="display: inline-block; background: #15803d; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700;">
            Responder en Faralaes
          </a>
        </p>
        <p>Si el boton no funciona, copia y pega este enlace:</p>
        <p style="word-break: break-all;">${safeReplyUrl}</p>
      </div>
    `,
  });

  await prisma.messageEmailNotification.upsert({
    where: {
      conversationId_receiverId: {
        conversationId,
        receiverId,
      },
    },
    update: {
      lastSentAt: now,
    },
    create: {
      conversationId,
      receiverId,
      lastSentAt: now,
    },
  });

  console.log("[message-email] sent", {
    conversationId,
    senderId,
    receiverId,
  });
};
