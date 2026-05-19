import { userActivityStatus } from "../lib/userActivity";

type UserActivityBadgeProps = {
  user?: {
    lastSeenAt?: Date | string | null;
    disabled?: boolean | null;
    hideActivityStatus?: boolean | null;
  } | null;
  compact?: boolean;
};

export default function UserActivityBadge({
  user,
  compact = false,
}: UserActivityBadgeProps) {
  const activity = userActivityStatus(user);

  if (!activity) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${
        activity.online
          ? "border-green-100 bg-green-50 text-green-800"
          : "border-stone-200 bg-stone-50 text-stone-600"
      } ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"} font-black uppercase tracking-wide`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          activity.online ? "bg-green-600" : "bg-stone-400"
        }`}
        aria-hidden="true"
      />
      {activity.label}
    </span>
  );
}
