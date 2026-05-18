const RUT_RE = /^\d{7,8}[-][\dkK]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type IdentifierType = "rut" | "email" | "unknown";

export function detectIdentifierType(value: string): IdentifierType {
  const clean = value.replace(/\./g, "").trim();
  if (RUT_RE.test(clean)) return "rut";
  if (EMAIL_RE.test(value)) return "email";
  return "unknown";
}

export function normalizeIdentifier(value: string): string {
  return value.replace(/\./g, "").trim();
}
