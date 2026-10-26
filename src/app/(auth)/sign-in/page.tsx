import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthForm";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in · shroom" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell
      title="Welcome back"
      footer={
        <>
          New here?{" "}
          <Link href="/sign-up" className="text-fg underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm next={next} />
    </AuthShell>
  );
}
