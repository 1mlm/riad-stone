import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, isAuthCookieValid } from "@/utils/auth";

// server actions are reachable independently of any page's middleware match,
// so each mutating action must check auth itself instead of trusting proxy.ts
export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies();
  if (!isAuthCookieValid(cookieStore.get(AUTH_COOKIE_NAME)?.value)) {
    redirect("/gate");
  }
}
