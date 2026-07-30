import { createHash, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "riad_stone_auth";

const hashCode = (code: string) => createHash("sha256").update(code).digest();

export function getExpectedAuthCookieValue(): string {
  return hashCode(process.env.SECRET_CODE ?? "").toString("hex");
}

export function isCodeCorrect(code: string): boolean {
  const expected = hashCode(process.env.SECRET_CODE ?? "");
  const actual = hashCode(code);
  return timingSafeEqual(expected, actual);
}

export function isAuthCookieValid(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const expected = Buffer.from(getExpectedAuthCookieValue(), "hex");
  const actual = Buffer.from(cookieValue, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
