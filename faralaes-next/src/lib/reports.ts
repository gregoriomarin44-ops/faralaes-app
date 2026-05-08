export const REPORT_TARGET_TYPES = ["listing", "user"] as const;
export const REPORT_REASONS = [
  "spam",
  "fraude",
  "contenido inapropiado",
  "articulo falso",
  "otro",
] as const;
export const REPORT_STATUSES = ["pending", "reviewed", "resolved"] as const;

export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];
export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const sanitizeReportText = (value: unknown, maxLength: number) =>
  typeof value === "string"
    ? value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";

export const isReportTargetType = (value: unknown): value is ReportTargetType =>
  typeof value === "string" &&
  REPORT_TARGET_TYPES.includes(value as ReportTargetType);

export const isReportReason = (value: unknown): value is ReportReason =>
  typeof value === "string" && REPORT_REASONS.includes(value as ReportReason);

export const isReportStatus = (value: unknown): value is ReportStatus =>
  typeof value === "string" &&
  REPORT_STATUSES.includes(value as ReportStatus);

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
