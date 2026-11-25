import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { ReadProgress } from "@/components/site/ReadProgress";
import { ShareButton } from "@/components/site/ShareButton";
import { getPost, POSTS, type Block } from "@/lib/blog";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  return post ? { title: post.title, description: post.lede } : {};
}

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "p":
      return <p className="text-lg leading-8 text-body">{b.text}</p>;
    case "ul":
      return (
        <ul className="grid gap-3">
          {b.items.map((i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-white p-4 text-body shadow-sm">
              <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-primary" />
              <span className="leading-7">{i}</span>
            </li>
          ))}
        </ul>
      );
    case "features":
      return (
        <ol className="grid gap-4">
          {b.items.map((f, n) => (
            <li key={f.title} className="flex gap-4 rounded-3xl border border-peach/60 bg-card p-5">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-base font-bold text-white">
                {n + 1}
              </span>
              <div>
                <h3 className="text-xl font-bold text-ink">{f.title}</h3>
                <p className="mt-1.5 leading-7 text-body">{f.text}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "audience":
      return (
        <ul className="grid gap-4 sm:grid-cols-2">
          {b.items.map((a) => (
            <li key={a.title} className="rounded-3xl bg-lilac-soft p-5">
              <h3 className="text-lg font-bold text-ink">{a.title}</h3>
              <p className="mt-1.5 leading-7 text-body">{a.text}</p>
            </li>
          ))}
        </ul>
      );
    case "stats":
      return (
        <figure>
          <dl className="grid gap-4 sm:grid-cols-3">
            {b.figures.map((f) => (
              <div key={f.value} className="rounded-3xl bg-violet-deep p-6 text-white">
                <dt className="text-4xl font-bold">{f.value}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-white/85">{f.label}</dd>
              </div>
            ))}
          </dl>
          <figcaption className="mt-2 text-xs text-muted">{b.caveat}</figcaption>
        </figure>
      );
    case "note":
      return <p className="rounded-2xl border-l-4 border-primary bg-white p-4 text-sm leading-6 text-body">{b.text}</p>;
    case "quote":
      return <blockquote className="rounded-3xl bg-violet-deep p-7 text-2xl font-bold leading-snug text-white">{b.text}</blockquote>;
  }
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  return (
    <>
      <ReadProgress targetId="article" />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> All articles
        </Link>

        <header className="mt-5 max-w-3xl">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted">
            <span className="rounded-full bg-lilac-soft px-2.5 py-0.5 text-xs font-bold text-indigo-brand">{post.tag}</span>
            {post.author} <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden /> {post.readingMinutes} min read
            </span>
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">{post.title}</h1>
          <p className="mt-5 text-xl leading-8 text-body">{post.lede}</p>
          <div className="mt-6">
            <ShareButton title={post.title} />
          </div>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <nav aria-label="In this article" className="sticky top-28">
              <p className="mb-3 text-sm font-bold text-ink">In this article</p>
              <ul className="flex flex-col gap-1 border-l-2 border-black/10">
                {post.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="-ml-0.5 block border-l-2 border-transparent py-1.5 pl-3 text-sm text-body hover:border-primary hover:text-ink">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article id="article" className="max-w-3xl">
            {post.sections.map((s) => (
              <section key={s.id} id={s.id} className="mb-12 scroll-mt-32">
                <h2 className="text-3xl font-bold leading-tight text-ink">{s.title}</h2>
                <div className="mt-5 grid gap-5">
                  {s.blocks.map((b, i) => (
                    <BlockView key={i} b={b} />
                  ))}
                </div>
              </section>
            ))}

            <section className="rounded-[28px] border border-peach bg-card p-7 text-center sm:p-10">
              <p className="mx-auto max-w-xl text-xl font-semibold leading-8 text-ink">{post.closing.text}</p>
              <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-white hover:bg-primary-hover">
                {post.closing.cta} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <p className="mt-6 text-sm font-bold text-primary">{post.closing.signoff}</p>
            </section>
          </article>
        </div>

        <section aria-labelledby="keep-reading" className="mt-16 border-t border-black/10 pt-10">
          <h2 id="keep-reading" className="text-2xl font-bold text-ink">Keep reading</h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {POSTS.filter((p) => p.slug !== post.slug).map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg">
                  <p className="text-sm font-semibold text-muted">
                    <span className="mr-2 rounded-full bg-lilac-soft px-2.5 py-0.5 text-xs font-bold text-indigo-brand">{p.tag}</span>
                    {p.readingMinutes} min read
                  </p>
                  <h3 className="mt-3 text-lg font-bold leading-snug text-ink">{p.title}</h3>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 font-bold text-primary">
                    Read the article <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
