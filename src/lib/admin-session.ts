import { createHmac, timingSafeEqual } from "crypto";

const SESSION_PAYLOAD = "ignite-admin-session";

export function createAdminToken(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SECRET is not set");
  }
  return createHmac("sha256", secret).update(SESSION_PAYLOAD).digest("hex");
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token || !process.env.ADMIN_SECRET) return false;
  let expected: string;
  try {
    expected = createAdminToken();
  } catch {
    return false;
  }
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
