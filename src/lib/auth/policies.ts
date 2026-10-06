import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";

function loginRedirectPath(locale: Locale): string {
  return `/${locale}/login`;
}

/** Safe same-origin return path for post-login redirect (`?next=`). */
async function resolveLoginNextPath(locale: Locale): Promise<string | null> {
  const pathname = (await headers()).get("x-pathname");
  if (!pathname) {
    return null;
  }

  const prefix = `/${locale}/`;
  if (!pathname.startsWith(prefix) || pathname.startsWith("//")) {
    return null;
  }

  if (
    pathname === `/${locale}/login` ||
    pathname === `/${locale}/register` ||
    pathname.startsWith(`/${locale}/forgot-password`) ||
    pathname.startsWith(`/${locale}/reset-password`)
  ) {
    return null;
  }

  return pathname;
}

/** Requires an active authenticated user for a protected server flow. */
export async function requireUser(locale: Locale): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    const nextPath = await resolveLoginNextPath(locale);
    if (nextPath) {
      redirect(
        `${loginRedirectPath(locale)}?next=${encodeURIComponent(nextPath)}`,
      );
    }
    redirect(loginRedirectPath(locale));
  }

  return user;
}

/** Requires an active administrator for a protected server flow. */
export async function requireAdmin(locale: Locale): Promise<SessionUser> {
  const user = await requireUser(locale);

  if (user.role !== "ADMIN") {
    redirect(`/${locale}`);
  }

  return user;
}
