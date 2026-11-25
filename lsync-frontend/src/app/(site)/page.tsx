import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, GraduationCap, Layers, Briefcase, Repeat, Share2, Sparkles, TrendingUp, Users } from "lucide-react";
import { Hero } from "@/components/site/Hero";
import { Reveal, RevealLi, ScrollWords, Stagger, StaggerItem, Timeline } from "@/components/site/motion";
import { POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: { absolute: "LSync | Your Unified Learning Portfolio" },
  description: "Bring your online learning together. Track progress, organise your skills and choose what to share with LSync.",
};

const STEPS = [
  { icon: Layers, title: "Connect your sources", text: "Link the places you learn: GitHub, YouTube, Coursera, Udemy, edX, blogs and docs. Skip it now and do it later from your dashboard." },
  { icon: Sparkles, title: "Log what you study", text: "Add a learning log in seconds. Every log counts towards a skill, so your effort never disappears." },
  { icon: TrendingUp, title: "See your progress", text: "Your dashboard, activity, skills and analytics show how far you have come, in one clear view." },
];

const AUDIENCE = [
  { icon: GraduationCap, label: "Students" },
  { icon: Briefcase, label: "Graduates and job seekers" },
  { icon: Repeat, label: "Career switchers" },
  { icon: Compass, label: "Self-taught learners" },
  { icon: Users, label: "Working professionals" },
];

const TINTS = ["from-violet-deep to-primary", "from-indigo-brand to-primary-soft", "from-primary to-peach"];

export default function LandingPage() {
  const stats = POSTS[0].sections[1].blocks.filter((b) => b.t === "stats").flatMap((b) => (b.t === "stats" ? b.figures : []));

  return (
    <>
      <Hero />

      {/* A single statement that lights up as you scroll. */}
      <section className="bg-violet-deep px-4 py-20 text-white sm:px-6 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <ScrollWords
            className="text-3xl font-bold leading-[1.25] sm:text-4xl lg:text-5xl"
            text="Learning happens on many platforms. Your progress should not be scattered across them. LSync keeps it together, so you can see how far you have come."
          />
          <Stagger as="div" className="mt-14 grid gap-4 sm:grid-cols-3">
            {stats.map((f) => (
              <StaggerItem key={f.value} className="rounded-3xl border border-white/15 bg-white/10 p-6">
                <p className="text-4xl font-bold">{f.value}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/85">{f.label}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mt-4 text-xs text-white/70">Initial LSync user research survey, 18 respondents. A small survey, not representative of all learners.</p>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">Three steps. That is all.</h2>
            <p className="mt-4 text-lg leading-relaxed text-body">If you can read this, you already understand it. That is the point.</p>
          </Reveal>
          <Timeline>
            {STEPS.map((s, i) => (
              <RevealLi key={s.title} className="relative flex gap-5">
                <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full border-2 border-primary bg-white text-base font-bold text-primary">{i + 1}</span>
                <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                  <span className="grid size-10 place-items-center rounded-xl bg-lilac-soft text-indigo-brand">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-body">{s.text}</p>
                </div>
              </RevealLi>
            ))}
          </Timeline>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 bg-white py-20 lg:py-28">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">What you can do</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">One place for everything you are learning</h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-4 lg:grid-cols-3">
            <StaggerItem lift className="rounded-3xl bg-lilac-soft p-7 lg:col-span-2">
              <Layers className="size-6 text-indigo-brand" aria-hidden />
              <h3 className="mt-4 text-2xl font-bold text-ink">Bring learning together</h3>
              <p className="mt-2 max-w-xl text-lg leading-relaxed text-body">See what you are engaging with across supported learning sources, instead of hunting through five different sites.</p>
            </StaggerItem>
            <StaggerItem lift className="rounded-3xl bg-violet-deep p-7 text-white">
              <TrendingUp className="size-6" aria-hidden />
              <h3 className="mt-4 text-xl font-bold">Track your progress</h3>
              <p className="mt-2 leading-relaxed text-white/85">Know what you have started, what you have finished and what is next.</p>
            </StaggerItem>
            <StaggerItem lift className="rounded-3xl border border-black/10 bg-card p-7">
              <Compass className="size-6 text-primary" aria-hidden />
              <h3 className="mt-4 text-xl font-bold text-ink">Organise your skills</h3>
              <p className="mt-2 leading-relaxed text-body">See where you are investing your time, skill by skill.</p>
            </StaggerItem>
            <StaggerItem lift className="rounded-3xl border border-black/10 bg-card p-7">
              <Repeat className="size-6 text-primary" aria-hidden />
              <h3 className="mt-4 text-xl font-bold text-ink">Review your journey</h3>
              <p className="mt-2 leading-relaxed text-body">Reflect on what you have learned and choose what to focus on next.</p>
            </StaggerItem>
            <StaggerItem lift className="rounded-3xl bg-peach-soft p-7">
              <div className="flex items-center gap-2">
                <Share2 className="size-6 text-orange-link" aria-hidden />
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-orange-link">Planned</span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-ink">Showcase what you choose</h3>
              <p className="mt-2 leading-relaxed text-body">A shareable learning profile, with you in control of what appears.</p>
            </StaggerItem>
          </Stagger>

          <Reveal className="mt-12">
            <p className="text-sm font-bold uppercase tracking-wide text-muted">Who it is for</p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {AUDIENCE.map((a) => (
                <li key={a.label} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-page px-4 py-2.5 text-base font-semibold text-ink">
                  <a.icon className="size-4 text-indigo-brand" aria-hidden /> {a.label}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">The availability of particular features and integrations depends on LSync&apos;s current product release.</p>
          </Reveal>
        </div>
      </section>

      <section id="blog" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary">From the blog</p>
              <h2 className="mt-2 text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">Ideas for learning better</h2>
            </div>
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-base font-bold text-primary hover:underline">
              All articles <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Reveal>
          <Stagger as="ul" className="mt-10 grid gap-5 md:grid-cols-3">
            {POSTS.map((p, i) => (
              <StaggerItem as="li" key={p.slug} lift>
                <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition-shadow hover:shadow-xl">
                  <div className={`bg-gradient-to-br ${TINTS[i % TINTS.length]} p-6`}>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">{p.tag}</span>
                    <p className="mt-10 text-sm font-semibold text-white/85">{p.readingMinutes} min read</p>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg font-bold leading-snug text-ink">{p.title}</h3>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 font-bold text-primary">
                      Read the article <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <Reveal className="mx-auto max-w-6xl rounded-[28px] bg-violet-deep px-6 py-14 text-center text-white sm:px-12">
          <p className="mx-auto max-w-2xl text-2xl font-bold leading-snug sm:text-3xl">You are investing time and effort in learning. Wouldn&apos;t it be helpful to see how far you have come?</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-ink transition-transform hover:-translate-y-0.5 hover:bg-peach-soft">
              Get started <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/login" className="inline-flex items-center rounded-xl border border-white/40 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/10">
              Sign in
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
