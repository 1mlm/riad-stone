"use server";

import { isCodeCorrect } from "@/utils/auth";
import { requireAuth } from "@/utils/requireAuth";

export async function verifyRevealCode(code: string): Promise<boolean> {
  await requireAuth();
  return isCodeCorrect(code);
}
