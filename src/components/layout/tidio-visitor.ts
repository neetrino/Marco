import { z } from "zod";

export type TidioVisitorIdentity = {
  distinct_id: string;
  email: string;
  name?: string;
  phone?: string;
};

export type TidioVisitorSource = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};

const tidioEmailSchema = z.string().trim().email();
const tidioPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .pipe(z.string().regex(/^\+[1-9]\d{6,14}$/));

function optionalTidioPhone(phone: string | null): string | undefined {
  const parsed = tidioPhoneSchema.safeParse(phone ?? "");
  return parsed.success ? parsed.data : undefined;
}

/** Maps a signed-in storefront user to Tidio visitor fields. */
export function buildTidioVisitorIdentity(
  user: TidioVisitorSource,
): TidioVisitorIdentity | null {
  const email = tidioEmailSchema.safeParse(user.email);
  if (!email.success) {
    return null;
  }

  const name = `${user.firstName} ${user.lastName}`.trim();
  const phone = optionalTidioPhone(user.phone);

  return {
    distinct_id: user.id,
    email: email.data,
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
  };
}

/** Inline snippet that must run before the Tidio widget script. */
export function assignTidioIdentifySnippet(
  visitor: TidioVisitorIdentity,
): string {
  return `document.tidioIdentify=${JSON.stringify(visitor)};`;
}
