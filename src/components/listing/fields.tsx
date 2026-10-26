import { cn } from "@/lib/cn";

// Form building blocks for the listing editor. Same look as the backend
// branch's AuthForm fields (src/components/auth/AuthForm.tsx).

const control =
  "mt-1.5 w-full rounded-2xl bg-surface px-4 py-3.5 text-[16px] text-fg outline-none ring-1 ring-line placeholder:text-fg-subtle focus:ring-fg-muted";

type FieldShell = { label: string; hint?: React.ReactNode; error?: string; counter?: string };

function Shell({ label, hint, error, counter, children }: FieldShell & { children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex justify-between text-[13px] text-fg-muted">
        {label}
        {counter && <span className="tabular-nums">{counter}</span>}
      </span>
      {children}
      {error ? (
        <span role="alert" className="mt-1.5 block text-[13px] text-like">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1.5 block text-[13px] text-fg-subtle">{hint}</span>
      )}
    </label>
  );
}

export function Field({ label, hint, error, counter, className, ...input }: FieldShell & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Shell label={label} hint={hint} error={error} counter={counter}>
      <input aria-invalid={Boolean(error)} className={cn(control, error && "ring-like", className)} {...input} />
    </Shell>
  );
}

export function TextArea({ label, hint, error, counter, className, ...input }: FieldShell & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Shell label={label} hint={hint} error={error} counter={counter}>
      <textarea aria-invalid={Boolean(error)} className={cn(control, "resize-none", error && "ring-like", className)} {...input} />
    </Shell>
  );
}

export function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-24">
      <h2 className="mb-3 text-[13px] uppercase tracking-[0.12em] text-fg-subtle">{title}</h2>
      {children}
    </section>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl bg-like/10 px-4 py-3 text-[14px] text-like">
      {message}
    </p>
  );
}
