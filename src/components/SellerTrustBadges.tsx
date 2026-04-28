import { CheckCircle2, ShieldCheck, Star } from "lucide-react";

type SellerTrustBadgesProps = {
  fullName?: string | null;
  location?: string | null;
  bio?: string | null;
  phone?: string | null;
  phoneVerified?: boolean | string | null;
  sellerBadge?: string | null;
};

export const SellerTrustBadges = ({
  fullName,
  location,
  bio,
  phone,
  phoneVerified,
  sellerBadge,
}: SellerTrustBadgesProps) => {
  const hasText = (value?: string | null) => Boolean(value?.trim());
  const isPhoneVerified = phoneVerified === true || String(phoneVerified).toLowerCase() === "true";
  const normalizedSellerBadge = sellerBadge?.trim().toLowerCase();

  const badges = [
    hasText(fullName) && hasText(location) && hasText(bio) && hasText(phone)
      ? { label: "Perfil completo", icon: CheckCircle2 }
      : null,
    isPhoneVerified ? { label: "Teléfono verificado", icon: ShieldCheck } : null,
    normalizedSellerBadge === "featured" ? { label: "Vendedor destacado", icon: Star } : null,
  ].filter(Boolean) as Array<{ label: string; icon: typeof CheckCircle2 }>;

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(({ label, icon: Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground/80"
        >
          <Icon className="h-3.5 w-3.5 text-primary" />
          {label}
        </span>
      ))}
    </div>
  );
};
