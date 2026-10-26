"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton } from "@/components/auth/AuthForm";
import { giveConsents, savePhone, sendForReview, submitCheckin, type StepState } from "@/app/onboarding/actions";

type Statement = { key: string; wording: string };

export function ConsentForm({ statements }: { statements: Statement[] }) {
  const [state, action, pending] = useActionState<StepState, FormData>(giveConsents, {});
  return (
    <form action={action} className="space-y-3">
      {statements.map((s) => (
        <label key={s.key} className="flex gap-3 rounded-2xl bg-surface p-4 text-[15px] leading-snug">
          <input type="checkbox" name="statement" value={s.key} required className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
          <span>{s.wording}</span>
        </label>
      ))}
      <FormError message={state.error} />
      <SubmitButton pending={pending}>I agree to all of these</SubmitButton>
    </form>
  );
}

export function PhoneForm() {
  const [state, action, pending] = useActionState<StepState, FormData>(savePhone, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Mobile number" name="phone" type="tel" autoComplete="tel" placeholder="07700 900123" required />
      <FormError message={state.error} />
      <SubmitButton pending={pending}>Save number</SubmitButton>
    </form>
  );
}

function Choice({ name, value, label }: { name: string; value: string; label: string }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-[15px]">
      <input type="radio" name={name} value={value} required className="size-5 accent-[var(--accent)]" />
      {label}
    </label>
  );
}

export function CheckinForm() {
  const [state, action, pending] = useActionState<StepState, FormData>(submitCheckin, {});
  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-[15px]">Does anyone else run this account, arrange your bookings, or take any of your earnings?</legend>
        <Choice name="others_involved" value="no" label="No, it's just me" />
        <Choice name="others_involved" value="yes" label="Yes" />
        <Choice name="others_involved" value="prefer_not_to_say" label="I'd rather not say" />
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-[15px]">Could you stop advertising tomorrow if you wanted to?</legend>
        <Choice name="free_to_stop" value="yes" label="Yes" />
        <Choice name="free_to_stop" value="no" label="No" />
        <Choice name="free_to_stop" value="not_sure" label="I'm not sure" />
      </fieldset>
      <label className="flex gap-3 rounded-2xl bg-surface p-4 text-[15px] leading-snug">
        <input type="checkbox" name="wants_contact" className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
        <span>I&apos;d like someone from shroom&apos;s safety team to contact me privately.</span>
      </label>
      <FormError message={state.error} />
      <SubmitButton pending={pending}>Send answers</SubmitButton>
    </form>
  );
}

export function SendForReviewButton({ ready }: { ready: boolean }) {
  const [state, action, pending] = useActionState<StepState, FormData>(() => sendForReview(), {});
  return (
    <form action={action} className="space-y-3">
      <FormError message={state.error} />
      <button
        disabled={!ready || pending}
        className="w-full rounded-full bg-accent py-4 text-[16px] font-medium text-accent-fg transition active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "One moment…" : "Send for review"}
      </button>
    </form>
  );
}
