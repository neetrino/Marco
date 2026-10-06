"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import { loginAction } from "@/features/auth/login-action";
import { AuthTextField } from "@/features/auth/ui/AuthTextField";
import { PasswordField } from "@/features/auth/ui/PasswordField";
import {
  AUTH_ERROR_CLASS,
  AUTH_FOOTER_CLASS,
  AUTH_FORM_CLASS,
  AUTH_LINK_CLASS,
  AUTH_LINK_EMPHASIS_CLASS,
  AUTH_SUBMIT_CLASS,
  AUTH_SUCCESS_CLASS,
} from "@/features/auth/ui/auth-form-classes";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type LoginFormProps = {
  locale: Locale;
  dictionary: Dictionary["auth"];
};

function LoginAlerts({
  resetSucceeded,
  error,
  dictionary,
}: {
  resetSucceeded: boolean;
  error?: string;
  dictionary: Dictionary["auth"];
}) {
  return (
    <>
      {resetSucceeded ? (
        <p role="status" className={AUTH_SUCCESS_CLASS}>
          {dictionary.resetPasswordSuccess}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className={AUTH_ERROR_CLASS}>
          {error}
        </p>
      ) : null}
    </>
  );
}

export function LoginForm({ locale, dictionary }: LoginFormProps) {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const resetSucceeded = searchParams.get("reset") === "1";
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(undefined);

    startTransition(async () => {
      const result = await loginAction({
        locale,
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        next: nextPath,
      });

      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <LoginAlerts
        resetSucceeded={resetSucceeded}
        error={error}
        dictionary={dictionary}
      />
      <form onSubmit={handleSubmit} className={AUTH_FORM_CLASS}>
        <AuthTextField
          name="email"
          label={dictionary.email}
          type="email"
          autoComplete="email"
          placeholder={dictionary.emailPlaceholder}
        />
        <PasswordField
          name="password"
          label={dictionary.password}
          placeholder={dictionary.passwordPlaceholder}
          showPasswordLabel={dictionary.showPassword}
          hidePasswordLabel={dictionary.hidePassword}
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <AppLink
            href={`/${locale}/forgot-password`}
            prefetchPolicy="intent"
            className={AUTH_LINK_CLASS}
          >
            {dictionary.forgotPassword}
          </AppLink>
        </div>
        <button type="submit" disabled={isPending} className={AUTH_SUBMIT_CLASS}>
          {isPending ? dictionary.submittingLogin : dictionary.submitLogin}
        </button>
      </form>
      <p className={AUTH_FOOTER_CLASS}>
        {dictionary.noAccount}{" "}
        <AppLink
          href={`/${locale}/register`}
          prefetchPolicy="intent"
          className={AUTH_LINK_EMPHASIS_CLASS}
        >
          {dictionary.signUp}
        </AppLink>
      </p>
    </>
  );
}
