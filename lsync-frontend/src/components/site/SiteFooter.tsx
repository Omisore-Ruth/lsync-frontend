import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { AskLilyLink } from "@/components/site/AskLilyLink";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo className="h-9" />
          <p className="mt-3 max-w-xs text-sm text-body">Your Learning Journey. Better Organised. With LSync.</p>
        </div>
        <nav aria-label="Explore">
          <p className="mb-3 text-sm font-bold text-ink">Explore</p>
          <ul className="flex flex-col gap-2 text-sm text-body">
            <li><Link href="/#how-it-works" className="hover:text-ink hover:underline">How it works</Link></li>
            <li><Link href="/#features" className="hover:text-ink hover:underline">Features</Link></li>
            <li><Link href="/blog" className="hover:text-ink hover:underline">Blog</Link></li>
            <li><AskLilyLink /></li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="mb-3 text-sm font-bold text-ink">Account</p>
          <ul className="flex flex-col gap-2 text-sm text-body">
            <li><Link href="/register" className="hover:text-ink hover:underline">Get started</Link></li>
            <li><Link href="/login" className="hover:text-ink hover:underline">Sign in</Link></li>
          </ul>
        </nav>
      </div>
      <p className="border-t border-black/5 px-4 py-4 text-center text-xs text-muted">LSync | Online Learning and Skills Development</p>
    </footer>
  );
}
