import type { Metadata, Viewport } from "next";
import "@fontsource-variable/montserrat";
import "./globals.css";
import { LilyLoader } from "@/components/lily/LilyLoader";
import { Preloader, PRELOAD_SCRIPT } from "@/components/Preloader";
import { AuthProvider } from "@/lib/auth/AuthProvider";

export const metadata: Metadata = {
  title: { default: "LSync", template: "%s | LSync" },
  description: "LSync: your unified learning portfolio.",
};

export const viewport: Viewport = {
  themeColor: "#510eac",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRELOAD_SCRIPT }} />
      </head>
      <body>
        <Preloader />
        <AuthProvider>{children}</AuthProvider>
        <LilyLoader />
      </body>
    </html>
  );
}
