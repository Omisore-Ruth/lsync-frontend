import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles on organising your online learning, tracking progress and building your learning portfolio.",
};

export default function BlogIndex() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="rise text-sm font-bold uppercase tracking-wide text-primary">LSync blog</p>
      <h1 style={{ "--i": 1 } as React.CSSProperties} className="rise mt-2 text-4xl font-bold text-ink sm:text-5xl">
        Ideas for a better organised learning journey
      </h1>
      <ul className="mt-10 grid gap-6 md:grid-cols-2">
        {POSTS.map((p, i) => (
          <li key={p.slug} style={{ "--i": 2 + i } as React.CSSProperties} className="rise">
            <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col rounded-3xl border border-peach bg-card p-7 transition-shadow hover:shadow-xl">
              <p className="text-sm font-semibold text-muted">
                <span className="mr-2 rounded-full bg-lilac-soft px-2.5 py-0.5 text-xs font-bold text-indigo-brand">{p.tag}</span>
                {p.readingMinutes} min read
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-snug text-ink">{p.title}</h2>
              <p className="mt-3 flex-1 leading-relaxed text-body">{p.lede}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 font-bold text-primary">
                Read the article <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
