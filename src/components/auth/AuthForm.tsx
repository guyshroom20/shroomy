import Link from "next/link";

/** Shared shell for the sign-in and sign-up screens. */
export function AuthShell({ title, children, footer }: { title: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col px-5 pt-10 pb-safe">
      <Link href="/" className="text-[15px] font-medium tracking-[-0.02em] text-fg-muted">
        shroom
      </Link>
      <h1 className="mt-8 text-[40px] font-medium leading-[1.05] tracking-[-0.04em]">{title}</h1>
      <div className="mt-8">{children}</div>
      <p className="mt-auto pt-10 text-center text-[14px] text-fg-muted">{footer}</p>
    </main>
  );
}

export function Field({ label, ...input }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[13px] text-fg-muted">{label}</span>
      <input
        className="mt-1.5 w-full rounded-2xl bg-surface px-4 py-3.5 text-[16px] text-fg outline-none ring-1 ring-line placeholder:text-fg-subtle focus:ring-fg-muted"
        {...input}
      />
    </label>
  );
}

export function SubmitButton({ children, pending }: { children: React.ReactNode; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent py-4 text-[16px] font-medium text-accent-fg transition active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "One moment…" : children}
    </button>
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
