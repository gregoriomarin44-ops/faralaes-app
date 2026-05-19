export type UserActivityInput = {
  lastSeenAt?: Date | string | null;
  disabled?: boolean | null;
  hideActivityStatus?: boolean | null;
};

export type UserActivityStatus = {
  label: string;
  online: boolean;
  muted: boolean;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const ONLINE_WINDOW_MS = 5 * MINUTE_MS;

const parseTimestamp = (value: Date | string | number | null | undefined) => {
  if (!value) {
    return null;
  }

  const timestamp =
    typeof value === "number"
      ? value
      : value instanceof Date
        ? value.getTime()
        : new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
};

export const formatLastSeen = (
  value: Date | string | number | null | undefined,
  now = new Date()
) => {
  const timestamp = parseTimestamp(value);

  if (!timestamp) {
    return "Actividad no disponible";
  }

  const elapsed = Math.max(0, now.getTime() - timestamp);

  if (elapsed < ONLINE_WINDOW_MS) {
    return "En línea ahora";
  }

  if (elapsed < HOUR_MS) {
    const minutes = Math.max(1, Math.round(elapsed / MINUTE_MS));
    return `Activo hace ${minutes} min`;
  }

  if (elapsed < DAY_MS) {
    return "Activo hoy";
  }

  const days = Math.max(1, Math.round(elapsed / DAY_MS));
  return days === 1 ? "Activo ayer" : `Activo hace ${days} días`;
};

export const userActivityStatus = (
  user: UserActivityInput | null | undefined,
  now = new Date()
): UserActivityStatus | null => {
  if (!user || user.disabled || user.hideActivityStatus) {
    return null;
  }

  const timestamp = parseTimestamp(user.lastSeenAt);

  if (!timestamp) {
    return {
      label: "Actividad no disponible",
      online: false,
      muted: true,
    };
  }

  return {
    label: formatLastSeen(timestamp, now),
    online: now.getTime() - timestamp < ONLINE_WINDOW_MS,
    muted: false,
  };
};

export const isResponsiveSeller = (lastSellerMessageAt?: Date | string | null) => {
  const timestamp = parseTimestamp(lastSellerMessageAt);

  if (!timestamp) {
    return false;
  }

  return Date.now() - timestamp < 7 * DAY_MS;
};
