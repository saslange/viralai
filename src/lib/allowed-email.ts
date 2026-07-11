export function isAllowedEmail(email: string | null | undefined) {
  const allowed = (process.env.ALLOWED_EMAIL ?? "sash@heysash.de").toLowerCase();
  return email?.toLowerCase() === allowed;
}
