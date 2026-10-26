import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { FiltersProvider } from "@/lib/filters";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className="antialiased">
        {/* Phone-width column; on desktop it sits centred like a device. */}
        <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-bg">
          <ToastProvider>
            <FiltersProvider>
              <SavedProvider>{children}</SavedProvider>
            </FiltersProvider>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}
