"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { loginSchema } from "@/features/auth/schemas";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

export type AuthActionState = { error?: string };

export type LoginActionInput = {
  locale: string;
  email: string;
  password: string;
  next?: string | null;
};

function resolveSafeNextPath(locale: Locale, raw: string | null | undefined): string {
  const homePath = `/${locale}`;

  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return homePath;
  }

  if (raw === homePath || raw === `${homePath}/`) {
    return homePath;
  }

  if (!raw.startsWith(`${homePath}/`)) {
    return homePath;
  }

  return raw;
}

export async function loginAction(input: LoginActionInput): Promise<AuthActionState> {
  const locale: Locale = isLocale(input.locale) ? input.locale : defaultLocale;
  const parsed = loginSchema.safeParse({
    email: input.email,
    password: input.password,
  });

  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  const passwordMatches = user
    ? await verifyPassword(parsed.data.password, user.passwordHash)
    : false;

  if (!user || !passwordMatches || user.status !== "ACTIVE") {
    return { error: "Invalid email or password." };
  }

  await getDb()
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));
  await createSession(user.id);
  redirect(resolveSafeNextPath(locale, input.next));
}
