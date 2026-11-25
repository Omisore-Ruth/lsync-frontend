"use client";

/**
 * Small building blocks for the public pages, made with Motion (the library formerly called Framer Motion).
 * They use the light `m` components inside <LazyMotion>, so only the animation code the site needs is downloaded.
 * Each one does a single job so the pages stay easy to read:
 *  - MotionProvider: turns movement down for visitors who ask their device for less motion
 *  - Reveal / RevealLi: fade and rise when scrolled into view
 *  - Stagger / StaggerItem: a group that arrives one item after another
 *  - ScrollWords: a sentence that lights up word by word as you scroll
 *  - Timeline: a line that draws itself down the steps as you scroll
 */
import { LazyMotion, MotionConfig, domAnimation, m, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function MotionProvider({ children }: { children: ReactNode }) {
  // LazyMotion with domAnimation loads only the animation features this site uses, which is much less JavaScript.
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

type RevealProps = { children: ReactNode; className?: string; delay?: number; y?: number };

export function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </m.div>
  );
}

export function RevealLi({ children, className, delay = 0, y = 24 }: RevealProps) {
  return (
    <m.li
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </m.li>
  );
}

const GROUP = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const ITEM = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } } };

export function Stagger({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ul" }) {
  const Tag = as === "ul" ? m.ul : m.div;
  return (
    <Tag className={className} variants={GROUP} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -80px 0px" }}>
      {children}
    </Tag>
  );
}

export function StaggerItem({ children, className, as = "div", lift = false }: { children: ReactNode; className?: string; as?: "div" | "li"; lift?: boolean }) {
  const Tag = as === "li" ? m.li : m.div;
  return (
    <Tag className={className} variants={ITEM} whileHover={lift ? { y: -5, transition: { duration: 0.25 } } : undefined}>
      {children}
    </Tag>
  );
}

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.5, 1]) // 0.5 keeps the not-yet-read words readable (3.5:1 on the purple);
  const reduce = useReducedMotion();
  return (
    <m.span aria-hidden style={{ opacity: reduce ? 1 : opacity }} className="mr-[0.26em] inline-block">
      {word}
    </m.span>
  );
}

export function ScrollWords({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.55"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <Word key={`${w}-${i}`} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
      ))}
    </p>
  );
}

export function Timeline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.65"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 110, damping: 26, restDelta: 0.001 });
  return (
    <div ref={ref} className="relative">
      <div aria-hidden className="absolute bottom-3 left-[21px] top-3 w-0.5 rounded bg-black/10" />
      <m.div aria-hidden style={{ scaleY, transformOrigin: "top" }} className="absolute bottom-3 left-[21px] top-3 w-0.5 rounded bg-primary" />
      <ol className="relative flex flex-col gap-10">{children}</ol>
    </div>
  );
}
