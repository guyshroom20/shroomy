import { redirect } from "next/navigation";

// The advertiser's own listing lives at /me; cards link here like any other profile.
export default function MyProfileRedirect() {
  redirect("/me");
}
