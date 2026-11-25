import { MotionProvider } from "@/components/site/motion";
import { WakeServer } from "@/components/site/WakeServer";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

/** The public pages (landing page and blog): a header with the menu, the page, and a footer. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold">
        Skip to content
      </a>
      <WakeServer />
      <SiteHeader />
      <main id="main" className="flex-1">
        <MotionProvider>{children}</MotionProvider>
      </main>
      <SiteFooter />
    </div>
  );
}
