import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthForm";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Create account · shroom" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const { as } = await searchParams;
  return (
    <AuthShell
      title="Create your account"
      footer={
        <>
          Already have one?{" "}
          <Link href="/sign-in" className="text-fg underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm initialRole={as === "advertiser" ? "advertiser" : "visitor"} />
    </AuthShell>
  );
}
