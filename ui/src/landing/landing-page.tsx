import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { LiquidGlass } from "./LiquidGlass";
import { cn } from "@/lib/cn";

/* ============================================================================
   AegisHealth-KG — landing page
   ----------------------------------------------------------------------------
   A single cinematic page. The 3D surface sits behind everything and reacts to
   the pointer; the copy is plain HTML above it, which keeps it selectable,
   selectable-by-screen-reader, and clickable without fighting the canvas.

   Navigation anchors land on three short sections below the hero. Everything
   else the product does lives behind "Explore AegisHealth-KG", which routes
   into the application — no fake screens, no dead ends.
   ========================================================================= */

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Technology", href: "#technology" },
  { label: "About", href: "#about" },
];

const PLATFORM_POINTS = [
  {
    index: "01",
    label: "Denial analysis",
    body: "Read the payer's stated reason, then hold it against the policy criteria that produced it — separately, and with both cited.",
  },
  {
    index: "02",
    label: "Evidence assembly",
    body: "Every finding traces back to a policy passage, a document excerpt, or a retrieved abstract. Nothing is asserted without a source.",
  },
  {
    index: "03",
    label: "Graph reasoning",
    body: "Patient, diagnosis, procedure, policy and requirement connected as a graph, so multi-hop prerequisite checks are derived rather than guessed.",
  },
  {
    index: "04",
    label: "Human in the loop",
    body: "The system assembles and organises. A qualified reviewer decides. A draft is never a submission, and never a promise of outcome.",
  },
];

const TECH_STACK = [
  { k: "Ingestion", v: "PDF and plain-text parsing with structured text extraction" },
  { k: "Extraction", v: "Deterministic ICD-10, CPT and CARC entity recognition with provenance" },
  { k: "Graph", v: "Neo4j knowledge graph over policies, requirements and clinical entities" },
  { k: "Retrieval", v: "Vector search over indexed literature, ranked against unmet criteria" },
  { k: "Output", v: "Grounded appeal drafts and a FHIR R4 bundle with per-assertion provenance" },
];

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [glassPresence, setGlassPresence] = useState(1);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // The sculpture belongs to the hero. Past it, recede to a faint presence
      // so the section copy sits on a calm field instead of a moving form.
      const hero = window.innerHeight * 0.85;
      const t = Math.min(Math.max(y / hero, 0), 1);
      setGlassPresence(1 - t * 0.82);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
<div className="relative min-h-screen bg-[#05070a] text-white">
      {/* z-0: the WebGL surface. main and header sit at z-10 above it. */}
      <LiquidGlass presence={glassPresence} />
      <LandingNav scrolled={scrolled} />

      <main className="relative z-10">
        <Hero />
        <PlatformSection />
        <TechnologySection />
        <AboutSection />
      </main>

      <LandingFooter />
    </div>
  );
}

/* ── Navigation ─────────────────────────────────────────────────────────── */

function LandingNav({ scrolled }: { scrolled: boolean }) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]",
        scrolled
          ? "border-b border-white/[0.07] bg-[#05070a]/72 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8"
      >
        {/* Identity */}
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7fe3d0]"
        >
          <LogoMark />
          <span className="text-[0.9375rem] font-medium tracking-[-0.01em] text-white/95">
            AegisHealth-KG
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 sm:gap-7">
          <ul className="hidden items-center gap-7 sm:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-xs text-[0.8125rem] text-white/55 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7fe3d0]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <Link
            to="/explore"
            className="group flex items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-1.5 text-[0.8125rem] text-white/85 transition-colors hover:border-white/45 hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7fe3d0]"
          >
            Get Started
            <ArrowUpRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </nav>
    </header>
  );
}

/** A small geometric mark: a ring with the knowledge-graph node inside it. */
function LogoMark() {
  return (
    <span
      className="relative flex size-7 items-center justify-center rounded-full border border-white/25"
      aria-hidden="true"
    >
      <span className="absolute size-1.5 rounded-full bg-[#7fe3d0]" />
      <span className="absolute size-3.5 rounded-full border border-white/35" />
    </span>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section
      className="relative flex min-h-[100svh] flex-col justify-center px-5 pb-24 pt-28 sm:px-8"
      aria-labelledby="hero-title"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Eyebrow */}
        <Enter delay="0ms">
          <p className="mb-7 flex items-center gap-3 text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-white/50">
            <span className="h-px w-8 bg-white/25" aria-hidden="true" />
            AI-Powered Healthcare Intelligence
          </p>
        </Enter>

        {/* Headline */}
        <Enter delay="80ms">
          <h1
            id="hero-title"
            className="max-w-[16ch] text-[clamp(3.25rem,10.5vw,9.5rem)] font-[350] leading-[0.92] tracking-[-0.045em] text-white [text-shadow:0_2px_60px_rgba(0,0,0,0.55)]"
          >
            Turn Denials
            <br />
            <span className="bg-gradient-to-r from-white via-[#dcecf3] to-[#8fd6c8] bg-clip-text text-transparent">
              Into Evidence.
            </span>
          </h1>
        </Enter>

        {/* Supporting copy */}
        <Enter delay="170ms">
          <p className="mt-8 max-w-[52ch] text-[1.0625rem] leading-relaxed text-white/62">
            Understand healthcare insurance denials through connected medical evidence,
            policy intelligence, and explainable AI.
          </p>
        </Enter>

        {/* Actions */}
        <Enter delay="260ms">
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/explore"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[0.9375rem] font-medium text-[#05070a] transition-colors hover:bg-[#dff3ef] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7fe3d0]"
            >
              Explore AegisHealth-KG
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>

            <a
              href="#technology"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-[0.9375rem] text-white/80 transition-colors hover:border-white/45 hover:bg-white/[0.05] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7fe3d0]"
            >
              Discover the Technology
            </a>
          </div>
        </Enter>
      </div>

      {/* Footer of the hero: studio-style labels and rules */}
      <Enter delay="380ms">
        <div className="pointer-events-none absolute inset-x-5 bottom-7 sm:inset-x-8">
          <div className="mx-auto flex max-w-[1400px] items-end justify-between gap-6">
            <p className="hidden items-center gap-2.5 text-[0.6875rem] uppercase tracking-[0.18em] text-white/35 sm:flex">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-[#7fe3d0]" />
              Live system
            </p>

            <p className="mx-auto flex items-center gap-2.5 text-[0.6875rem] uppercase tracking-[0.18em] text-white/45 sm:mx-0">
              <MoveIcon />
              Move your cursor to interact
            </p>

            <p className="hidden text-right text-[0.6875rem] uppercase tracking-[0.18em] text-white/30 lg:block">
              Evidence, made legible
            </p>
          </div>
        </div>
      </Enter>
    </section>
  );
}

function MoveIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7.5" opacity="0.55" />
      <path d="M10 5.5v9M5.5 10h9" opacity="0.8" />
    </svg>
  );
}

/* ── Sections ───────────────────────────────────────────────────────────── */

function Section({
  id,
  index,
  label,
  title,
  children,
}: {
  id: string;
  index: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="relative scroll-mt-20 border-t border-white/[0.07] px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <header className="mb-14 flex flex-col gap-4 sm:mb-20 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-3 text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-white/40">
              <span className="font-mono text-white/30">{index}</span>
              <span className="h-px w-6 bg-white/20" aria-hidden="true" />
              {label}
            </p>
            <h2
              id={`${id}-title`}
              className="max-w-[20ch] text-[clamp(2rem,5vw,3.5rem)] font-[350] leading-[1.02] tracking-[-0.035em] text-white"
            >
              {title}
            </h2>
          </div>
        </header>

        {children}
      </div>
    </section>
  );
}

function PlatformSection() {
  return (
    <Section
      id="platform"
      index="01"
      label="Platform"
      title="An investigation workspace, not a black box."
    >
      <div className="grid gap-px overflow-hidden rounded-sm border border-white/[0.07] bg-white/[0.05] sm:grid-cols-2">
        {PLATFORM_POINTS.map((point) => (
          <article key={point.index} className="bg-[#070a0e]/90 p-7 sm:p-9">
            <p className="mb-5 font-mono text-[0.6875rem] text-white/30">{point.index}</p>
            <h3 className="mb-3 text-[1.125rem] font-medium tracking-[-0.01em] text-white">
              {point.label}
            </h3>
            <p className="max-w-[46ch] text-[0.9375rem] leading-relaxed text-white/55">
              {point.body}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function TechnologySection() {
  return (
    <Section
      id="technology"
      index="02"
      label="Technology"
      title="Hybrid retrieval over a policy knowledge graph."
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <dl className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
          {TECH_STACK.map((row) => (
            <div
              key={row.k}
              className="grid gap-1 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8"
            >
              <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-white/40">
                {row.k}
              </dt>
              <dd className="max-w-[60ch] text-[0.9375rem] leading-relaxed text-white/60">
                {row.v}
              </dd>
            </div>
          ))}
        </dl>

        <aside className="space-y-6 lg:pl-8">
          <div className="rounded-sm border border-white/[0.07] bg-white/[0.02] p-6">
            <p className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[#7fe3d0]">
              Grounding rule
            </p>
            <p className="text-[0.9375rem] leading-relaxed text-white/60">
              The system does not invent missing criteria, policy rules, evidence or
              citations. If the source record does not contain it, the interface says so
              rather than filling the gap.
            </p>
          </div>

          <div className="rounded-sm border border-white/[0.07] bg-white/[0.02] p-6">
            <p className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-white/40">
              Current state
            </p>
            <p className="text-[0.9375rem] leading-relaxed text-white/60">
              Document ingestion and entity extraction are running against a live API.
              Graph reasoning, evidence retrieval, appeal drafting and FHIR emission are
              not yet implemented, and the interface states that where it matters.
            </p>
          </div>
        </aside>
      </div>
    </Section>
  );
}

function AboutSection() {
  return (
    <Section
      id="about"
      index="03"
      label="About"
      title="Built to make a denial defensible."
    >
      <div className="max-w-[62ch]">
        <p className="text-[clamp(1.125rem,2.2vw,1.5rem)] font-[350] leading-[1.45] tracking-[-0.015em] text-white/85">
          A denial is rarely wrong because a clinician reasoned badly. It is usually wrong
          because a criterion was never evidenced — or never read. AegisHealth-KG exists to
          close that gap: to hold the payer's policy, the clinical record, and the
          published evidence against one another, and to show exactly where they do and do
          not meet.
        </p>
        <p className="mt-8 max-w-[56ch] text-[0.9375rem] leading-relaxed text-white/50">
          This is a research prototype working entirely on synthetic data. No real patient
          information, no live payer connections, and no claim about any outcome. It
          assembles material for a qualified reviewer to judge — nothing more.
        </p>

        <Link
          to="/explore"
          className="group mt-12 inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-[0.9375rem] text-white/85 transition-colors hover:border-white/45 hover:bg-white/[0.05] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7fe3d0]"
        >
          Enter the workspace
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </Section>
  );
}

function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.07] px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.8125rem] text-white/40">AegisHealth-KG</p>
        <p className="text-[0.8125rem] text-white/35">
          Synthetic data only. No real patient information.
        </p>
        <p className="font-mono text-[0.6875rem] text-white/25">
          Prototype · v0.1
        </p>
      </div>
    </footer>
  );
}

/* ── Entrance animation ─────────────────────────────────────────────────── */

/**
 * Fade-and-rise on first paint. CSS-only, and disabled under
 * prefers-reduced-motion so nothing animates for visitors who opt out.
 */
function Enter({
  children,
  delay = "0ms",
  className,
}: {
  children: React.ReactNode;
  delay?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-[rise_900ms_cubic-bezier(0.2,0,0,1)_both] motion-reduce:animate-none",
        className,
      )}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}