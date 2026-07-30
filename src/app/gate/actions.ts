"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HistoryItemType } from "@/generated/prisma/enums";
import {
  AUTH_COOKIE_NAME,
  getExpectedAuthCookieValue,
  isCodeCorrect,
} from "@/utils/auth";
import { logHistory } from "@/utils/history";

export async function unlockWithCode(
  _prevState: { error: boolean },
  formData: FormData,
): Promise<{ error: boolean }> {
  const code = String(formData.get("code") ?? "");

  if (!isCodeCorrect(code)) return { error: true };

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, getExpectedAuthCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  await logHistory(HistoryItemType.LOGIN, { code });
  redirect("/");
}
