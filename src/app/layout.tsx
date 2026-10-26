import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { getAccount } from "@/lib/auth";
import { getProfiles } from "@/lib/data/profiles";
import { FiltersProvider } from "@/lib/filters";
import { MyListingProvider } from "@/lib/my-listing";
import { ProfilesProvider } from "@/lib/profiles";
import { SavedProvider } from "@/lib/saved";
import { ToastProvider } from "@/lib/toast";

export const metadata: Metadata = {
  title: "shroom",
  description: "Verified UK directory",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#121212",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [profiles, account] = await Promise.all([getProfiles(), getAccount()]);
  return (
    <html lang="en-GB">
      <body className="antialiased">
        {/* Phone-width column; on desktop it sits centred like a device. */}
        <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-bg">
          <ToastProvider>
            <ProfilesProvider profiles={profiles}>
              <MyListingProvider>
                <FiltersProvider>
                  <SavedProvider signedIn={Boolean(account)}>{children}</SavedProvider>
                </FiltersProvider>
              </MyListingProvider>
            </ProfilesProvider>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}
