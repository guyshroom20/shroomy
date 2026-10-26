"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton } from "@/components/auth/AuthForm";
import { signIn, type AuthState } from "../actions";

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/"} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <FormError message={state.error} />
      <SubmitButton pending={pending}>Sign in</SubmitButton>
    </form>
  );
}
