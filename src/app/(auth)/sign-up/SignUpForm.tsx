"use client";

import { MailCheck } from "lucide-react";
import { useActionState, useState } from "react";
import { Field, FormError, SubmitButton } from "@/components/auth/AuthForm";
import { cn } from "@/lib/cn";
import { signUp, type AuthState } from "../actions";

const roles = [
  { id: "visitor", title: "I'm browsing", body: "Save profiles and message advertisers." },
  { id: "advertiser", title: "I want to advertise", body: "One verified profile, just for you." },
] as const;

export function SignUpForm({ initialRole }: { initialRole: "visitor" | "advertiser" }) {
  const [role, setRole] = useState(initialRole);
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});

  if (state.sent) {
    return (
      <div className="flex flex-col items-center rounded-[28px] bg-surface px-6 py-12 text-center">
        <MailCheck className="size-8 text-accent" />
        <p className="mt-4 text-[17px]">Check your email</p>
        <p className="mt-1 text-[14px] text-fg-muted">Tap the link we sent to finish creating your account.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={role === r.id}
            onClick={() => setRole(r.id)}
            className={cn(
              "rounded-3xl p-4 text-left ring-1 transition",
              role === r.id ? "bg-surface-2 ring-accent" : "bg-surface ring-line",
            )}
          >
            <span className="block text-[15px] font-medium">{r.title}</span>
            <span className="mt-1 block text-[13px] text-fg-muted">{r.body}</span>
          </button>
        ))}
      </div>
      <Field label="Display name" name="display_name" autoComplete="nickname" maxLength={40} required />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      <label className="flex items-start gap-3 text-[14px] text-fg-muted">
        <input type="checkbox" name="adult" required className="mt-0.5 size-5 accent-[var(--accent)]" />
        <span>
          I&apos;m 18 or over and agree to the terms. {role === "advertiser" ? "I'll verify my ID before my profile goes live." : "I may be asked to confirm my age."}
        </span>
      </label>
      <FormError message={state.error} />
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  );
}
