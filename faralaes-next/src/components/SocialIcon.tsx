type SocialIconName = "copy" | "facebook" | "instagram" | "share" | "whatsapp";

type SocialIconProps = {
  name: SocialIconName;
  className?: string;
};

export default function SocialIcon({ name, className = "h-4 w-4" }: SocialIconProps) {
  if (name === "instagram") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect height="18" rx="5" width="18" x="3" y="3" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" />
      </svg>
    );
  }

  if (name === "facebook") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14 8.4V7.1c0-.8.2-1.3 1.4-1.3H17V3.1c-.8-.1-1.6-.1-2.4-.1-2.4 0-4 1.5-4 4.1v1.3H8v3h2.6V21H14v-9.6h2.7l.4-3H14Z" />
      </svg>
    );
  }

  if (name === "whatsapp") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.7Z" />
        <path d="M8.8 8.7c.2 3 2.5 5.3 5.5 5.8l1.3-1.3-2.2-1-1 .7c-1-.5-1.7-1.2-2.2-2.2l.7-1-1-2.2-1.1 1.2Z" />
      </svg>
    );
  }

  if (name === "copy") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M8 8h11v11H8z" />
        <path d="M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  );
}
