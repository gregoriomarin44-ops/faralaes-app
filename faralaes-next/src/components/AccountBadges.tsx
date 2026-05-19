import {
  accountTypeLabels,
  normalizeAccountType,
  type AccountType,
} from "../lib/accountTypes";

type AccountBadgeUser = {
  accountType?: AccountType | string | null;
  verified?: boolean | null;
};

type AccountBadgesProps = {
  user?: AccountBadgeUser | null;
  compact?: boolean;
};

const accountTypeTone: Record<AccountType, string> = {
  individual: "border-stone-200 bg-white text-stone-700",
  shop: "border-green-100 bg-green-50 text-green-800",
  designer: "border-red-100 bg-red-50 text-red-800",
};

export default function AccountBadges({ user, compact = false }: AccountBadgesProps) {
  const accountType = normalizeAccountType(user?.accountType);
  const sizeClass = compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex rounded-full border font-black uppercase tracking-wide ${sizeClass} ${accountTypeTone[accountType]}`}
      >
        {accountTypeLabels[accountType]}
      </span>
      {user?.verified ? (
        <span
          className={`inline-flex rounded-full border border-amber-100 bg-amber-50 font-black uppercase tracking-wide text-amber-800 ${sizeClass}`}
        >
          Verificado
        </span>
      ) : null}
    </span>
  );
}
