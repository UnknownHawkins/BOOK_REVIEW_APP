"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Scene3D from "@/components/Scene3D";
import BookCard from "@/components/BookCard";
import TypewriterText from "@/components/TypewriterText";
import { api } from "@/utils/api";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowRight, BookOpen, Feather, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   Hidden SVG Ink Filter (renders into DOM, used via CSS)
═══════════════════════════════════════════════════════════════ */
function InkFilterDef() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
      <defs>
        <filter id="ink-distort" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" result="noise" seed="3" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="ink-blur-sm">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Horizontal Marquee Ticker — book titles scroll endlessly
═══════════════════════════════════════════════════════════════ */
const TICKER_ITEMS = [
  "Don Quixote", "War and Peace", "Crime and Punishment", "Middlemarch",
  "Ulysses", "In Search of Lost Time", "The Brothers Karamazov", "Moby-Dick",
  "Anna Karenina", "Jane Eyre", "Great Expectations", "David Copperfield",
  "Wuthering Heights", "The Grapes of Wrath", "East of Eden", "Beloved",
];

function BookTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{
      overflow: "hidden",
      borderTop: "1px solid rgba(203,162,88,0.2)",
      borderBottom: "1px solid rgba(203,162,88,0.2)",
      padding: "10px 0",
      position: "relative",
    }}>
      {/* Left fade */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 80,
        background: "linear-gradient(90deg, var(--background), transparent)",
        zIndex: 2, pointerEvents: "none",
      }} />
      {/* Right fade */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 80,
        background: "linear-gradient(-90deg, var(--background), transparent)",
        zIndex: 2, pointerEvents: "none",
      }} />

      <div className="marquee-track">
        {doubled.map((title, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "0 20px",
              fontSize: 11, letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: i % 4 === 0
                ? "var(--aged-gold)"
                : "rgba(0,0,0,0.35)",
              fontFamily: "Georgia, serif",
              whiteSpace: "nowrap",
            }}
            className="dark:[color:rgba(255,255,255,0.35)]"
          >
            {title}
            <span style={{ opacity: 0.35, fontSize: 8 }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Floating Annotation Notes — scattered around scene
═══════════════════════════════════════════════════════════════ */
function AnnotationNote({
  text, x, y, rotation, delay, color = "#f5e6a0",
}: {
  text: string; x: string; y: string;
  rotation: number; delay: number; color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      style={{
        position: "absolute", left: x, top: y,
        backgroundColor: color,
        boxShadow: "2px 4px 14px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.5)",
        borderRadius: 2,
        padding: "8px 10px",
        fontSize: 9,
        lineHeight: 1.6,
        color: "rgba(40,25,8,0.85)",
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        transform: `rotate(${rotation}deg)`,
        maxWidth: 90,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      {/* Ruled lines */}
      {[0,1,2].map(i => (
        <div key={i} style={{
          height: 1, backgroundColor: "rgba(0,0,0,0.1)",
          marginBottom: 5, borderRadius: 1,
          width: i === 2 ? "60%" : "100%",
        }} />
      ))}
      <div style={{ marginTop: 4, fontSize: 9, fontStyle: "italic", color: "rgba(107,78,42,0.7)" }}>
        {text}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Ink-stroke SVG Underline
═══════════════════════════════════════════════════════════════ */
function InkUnderlineSVG({ color = "#b8963a", width = 320 }: { color?: string; width?: number }) {
  return (
    <svg
      width={width} height="10" viewBox={`0 0 ${width} 10`}
      style={{ display: "block", marginTop: -2, overflow: "visible" }}
    >
      <path
        d={`M0 6 Q${width * 0.12} 2, ${width * 0.24} 6 T${width * 0.5} 5 T${width * 0.76} 7 T${width} 5`}
        fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: "url(#ink-distort)" }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Feature Card — advanced parchment with rotating border on hover
═══════════════════════════════════════════════════════════════ */
interface FeatCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  delay: number;
  stat: string;
  statLabel: string;
}

function FeatCard({ icon, title, desc, accent, delay, stat, statLabel }: FeatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="parchment-card paper-texture relative overflow-hidden group cursor-default"
      style={{ borderTopWidth: 3, borderTopColor: accent, borderTopStyle: "solid" }}
    >
      {/* Hover ink-bleed ambient */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at 50% 0%, ${accent}08, transparent 70%)`,
        opacity: 0, transition: "opacity 0.4s",
      }} className="group-hover:opacity-100" />

      <div style={{ padding: "24px 22px", position: "relative" }}>
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 6,
          backgroundColor: `${accent}14`,
          border: `1px solid ${accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent, marginBottom: 16,
          boxShadow: `0 2px 12px ${accent}18`,
        }}>
          {icon}
        </div>

        <h3 style={{
          fontFamily: "var(--font-crimson), Georgia, serif",
          fontSize: 20, fontWeight: 600, color: "var(--foreground)",
          marginBottom: 8, lineHeight: 1.2,
        }}>{title}</h3>

        <p style={{
          fontFamily: "var(--font-grotesk), system-ui, sans-serif",
          fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.65,
          marginBottom: 20,
        }}>{desc}</p>

        {/* Stat */}
        <div style={{
          display: "flex", alignItems: "baseline", gap: 6,
          paddingTop: 16,
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}>
          <span style={{
            fontSize: 22, fontWeight: 700,
            color: accent,
            fontFamily: "var(--font-crimson), Georgia, serif",
          }}>{stat}</span>
          <span style={{
            fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--muted-foreground)",
            fontFamily: "var(--font-grotesk), system-ui, sans-serif",
          }}>{statLabel}</span>
        </div>
      </div>

      {/* Corner ornament */}
      <div style={{
        position: "absolute", bottom: 12, right: 12, opacity: 0,
        transition: "opacity 0.3s", color: accent, fontSize: 14,
      }} className="group-hover:opacity-70">✦</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Section Divider — ink ornament
═══════════════════════════════════════════════════════════════ */
function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--aged-gold), transparent)", opacity: 0.35 }} />
      <svg width="18" height="18" viewBox="0 0 18 18">
        <polygon points="9,2 10.8,7 16,9 10.8,11 9,16 7.2,11 2,9 7.2,7" fill="var(--aged-gold)" opacity="0.55" />
      </svg>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--aged-gold), transparent)", opacity: 0.35 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroO = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => setMounted(true), []);

  const { data: trendingRes, isLoading } = useQuery({
    queryKey: ["trendingBooks"],
    queryFn: async () => (await api.get("/books/trending")).data,
  });
  const trendingBooks = trendingRes?.books || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f0eb] dark:bg-[#13221d] text-foreground">
      <InkFilterDef />
      <Navbar />

      {/* ═══════ HERO ═══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden pt-20 pb-0 bg-[#f2f0eb] dark:bg-[#13221d] scanlines"
      >
        {/* Fine grid overlay */}
        <div className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.025) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Radial ambient glow */}
        <div className="absolute top-0 right-1/3 -z-10 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(0,117,74,0.07) 0%, transparent 70%)" }} />
        <div className="absolute top-40 left-1/4 -z-10 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(184,150,58,0.06) 0%, transparent 70%)" }} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
          <div className="grid md:grid-cols-12 gap-8 items-center min-h-[88vh] md:min-h-[76vh]">

            {/* ── Left column ─────────────────────────────────── */}
            <motion.div
              style={{ y: heroY, opacity: heroO }}
              className="md:col-span-7 text-center md:text-left space-y-8"
            >
              {/* Label */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "var(--aged-gold)", fontFamily: "var(--font-grotesk), system-ui, sans-serif",
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polygon points="6,1 7.4,4.6 11.5,6 7.4,7.4 6,11 4.6,7.4 0.5,6 4.6,4.6" fill="var(--aged-gold)" />
                  </svg>
                  A Literary Flagship — Est. 2024
                </span>
              </motion.div>

              {/* Headline */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
                <h1
                  className="text-ink-glow"
                  style={{
                    fontFamily: "var(--font-crimson), 'IM Fell English', Georgia, serif",
                    fontSize: "clamp(2.8rem, 7vw, 5rem)",
                    lineHeight: 1.12,
                    fontWeight: 400,
                    color: "#1E3932",
                  }}
                >
                  <span className="dark:[color:white]">The finest place to</span>
                  <br />
                  <span style={{ fontStyle: "italic", color: "#006241" }}
                    className="dark:[color:#d4e9e2]"
                  >
                    <TypewriterText
                      texts={["discover books.", "track your reads.", "write reviews.", "explore classics."]}
                      typingSpeed={60}
                      deletingSpeed={30}
                      pauseAfter={2600}
                    />
                  </span>
                  <br />
                  <span style={{ display: "inline-block" }}>
                    <span
                      className="font-bold dark:[color:#cba258]"
                      style={{ color: "#1E3932" }}
                    >
                      Your Literary Journey
                    </span>
                    <InkUnderlineSVG color="var(--aged-gold)" width={340} />
                  </span>
                </h1>
              </motion.div>

              {/* Sub-copy */}
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.28 }}
                style={{
                  fontFamily: "var(--font-grotesk), system-ui, sans-serif",
                  fontSize: 15, lineHeight: 1.72, maxWidth: 520,
                  color: "rgba(0,0,0,0.58)",
                }}
                className="mx-auto md:mx-0 dark:[color:rgba(255,255,255,0.65)]"
              >
                Manage your personal library, log real-time reading progress, write reviews with
                vibe-check indicators, and explore AI-powered recommendations via DeepSeek.
              </motion.p>

              <Ornament className="max-w-xs mx-auto md:mx-0" />

              {/* CTA group */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.38 }}
                className="flex flex-wrap items-center justify-center md:justify-start gap-4"
              >
                {/* Rotating border on primary CTA */}
                <Link href="/books" className="rotating-border rounded-full p-[2px] inline-block" style={{ position: "relative" }}>
                  <div style={{
                    background: "#006241", color: "#fff",
                    padding: "10px 24px", borderRadius: 9999,
                    fontWeight: 600, fontSize: 14,
                    display: "flex", alignItems: "center", gap: 8,
                    fontFamily: "var(--font-grotesk), system-ui, sans-serif",
                    letterSpacing: "-0.01em",
                  }}>
                    <BookOpen size={15} />
                    Explore the Library
                    <ArrowRight size={14} />
                  </div>
                </Link>

                {mounted && !isAuthenticated && (
                  <Link href="/auth/register" className="btn-dark-outlined" style={{ fontSize: 14 }}>
                    Join Free
                  </Link>
                )}
              </motion.div>

              {/* Micro stats */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.52 }}
                className="flex gap-10 pt-2 justify-center md:justify-start"
              >
                {[["10K+","Books"],["3K+","Reviews"],["∞","AI Reads"]].map(([n, l]) => (
                  <div key={l}>
                    <div style={{
                      fontSize: 26, fontWeight: 700,
                      color: "#006241", fontFamily: "var(--font-crimson), Georgia, serif",
                    }} className="dark:[color:#cba258]">{n}</div>
                    <div style={{
                      fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
                      color: "rgba(0,0,0,0.45)", fontFamily: "var(--font-grotesk), system-ui, sans-serif",
                    }} className="dark:[color:rgba(255,255,255,0.45)]">{l}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* ── Right column — 3D scene + annotation notes ───── */}
            <div className="md:col-span-5 hidden md:block relative select-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.88, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.35, ease: [0.16,1,0.3,1] }}
                style={{ position: "relative" }}
              >
                {/* Floating annotation notes */}
                <AnnotationNote text="must re-read" x="2%" y="15%" rotation={-6} delay={0.8} color="rgba(245,230,160,0.92)" />
                <AnnotationNote text="beautiful prose" x="72%" y="8%" rotation={4} delay={1.1} color="rgba(210,235,220,0.92)" />
                <AnnotationNote text="★★★★★" x="78%" y="72%" rotation={-3} delay={1.4} color="rgba(245,230,160,0.92)" />

                <Scene3D interval={9500} showIndicator={true} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Book ticker at the very bottom of hero */}
        <BookTicker />
      </section>

      {/* ═══════ TRENDING BOOKS ═════════════════════════════════ */}
      <section className="py-20 bg-white dark:bg-[#1e3932] border-t border-[#edebe9] dark:border-[#2b5148]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p style={{
                fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
                color: "var(--aged-gold)", fontFamily: "var(--font-grotesk), system-ui, sans-serif",
                marginBottom: 4,
              }}>Community Picks</p>
              <h2 style={{
                fontFamily: "var(--font-crimson), Georgia, serif",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 400,
                color: "#006241",
              }} className="dark:[color:white]">Trending This Week</h2>
            </div>
            <Link href="/books" style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 13, fontWeight: 600,
              color: "#00754A", fontFamily: "var(--font-grotesk), system-ui, sans-serif",
            }} className="dark:[color:#cba258] hover:underline">
              View All <ArrowRight size={13} />
            </Link>
          </div>

          <Ornament className="mb-10" />

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="aspect-[2/3] w-full rounded" style={{ background: "rgba(0,0,0,0.06)" }} />
                  <div className="h-3 w-3/4 rounded" style={{ background: "rgba(0,0,0,0.06)" }} />
                  <div className="h-3 w-1/2 rounded" style={{ background: "rgba(0,0,0,0.06)" }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {trendingBooks.map((book: any, idx: number) => (
                <motion.div key={book.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, delay: idx * 0.05 }}
                  viewport={{ once: true }}
                >
                  <BookCard book={book} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════ FEATURE BAND ═══════════════════════════════════ */}
      <section className="py-24 bg-[#f2f0eb] dark:bg-[#13221d] border-t border-[#edebe9] dark:border-[#2b5148]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p style={{
              fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--aged-gold)", fontFamily: "var(--font-grotesk), system-ui, sans-serif",
              marginBottom: 12,
            }}>What You Get</p>
            <h2 style={{
              fontFamily: "var(--font-crimson), Georgia, serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 400,
              color: "#1E3932", lineHeight: 1.18,
            }} className="dark:[color:white]">
              Everything you need to catalogue<br />
              <em style={{ color: "#006241" }}>your entire reading life</em>
            </h2>
            <Ornament className="mt-8" />
          </div>

          <div className="grid md:grid-cols-3 gap-7">
            <FeatCard
              delay={0} accent="#006241"
              icon={<BookOpen size={22} />}
              title="Personalized Library"
              desc="Organize books across Reading List, Wishlist, and Favorites. Filter by status, title, or page count. Track progress with a live bar."
              stat="10K+" statLabel="books indexed"
            />
            <FeatCard
              delay={0.14} accent="#b8963a"
              icon={<Feather size={22} />}
              title="Vibe-Check Reviews"
              desc="Write reviews and tag them positive, critical, mixed, or neutral. Add emoji stickers and star ratings for expressive literary critique."
              stat="3K+" statLabel="reviews written"
            />
            <FeatCard
              delay={0.28} accent="#2d5a4a"
              icon={<Sparkles size={22} />}
              title="DeepSeek AI Assistant"
              desc="Summarize any book's review chorus instantly. Get smart recommendations tuned to your literary taste — powered by DeepSeek."
              stat="AI" statLabel="powered reads"
            />
          </div>
        </div>
      </section>

      {/* ═══════ REWARDS CTA ════════════════════════════════════ */}
      <section className="py-20 border-t border-[#2b5148]" style={{ backgroundColor: "#1E3932" }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Gold ornament top */}
          <div className="flex items-center gap-4 justify-center mb-10">
            <div style={{ height: 1, width: 60, background: "rgba(203,162,88,0.4)" }} />
            <svg width="22" height="22" viewBox="0 0 22 22">
              <polygon points="11,2 13.2,8 20,11 13.2,14 11,20 8.8,14 2,11 8.8,8" fill="#cba258" opacity="0.75" />
            </svg>
            <div style={{ height: 1, width: 60, background: "rgba(203,162,88,0.4)" }} />
          </div>

          <h2 style={{
            fontFamily: "var(--font-crimson), Georgia, serif",
            fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 400,
            color: "white", marginBottom: 16, lineHeight: 1.15,
          }}>
            Unlock the Full<br />
            <em style={{ color: "#cba258" }}>Literary Experience</em>
          </h2>

          <p style={{
            fontFamily: "var(--font-grotesk), system-ui, sans-serif",
            fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 36,
            lineHeight: 1.75, maxWidth: 460, margin: "0 auto 36px",
          }}>
            AI-generated digital E-Books, real-time page progress, custom vibe badges,
            star reviews, and a library that grows with you.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/books" style={{
              padding: "11px 28px", borderRadius: 9999,
              background: "white", color: "#00754A",
              fontWeight: 600, fontSize: 14,
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-grotesk), system-ui, sans-serif",
              letterSpacing: "-0.01em",
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
            }}>
              <BookOpen size={15} />
              Start Reading
            </Link>
            {mounted && !isAuthenticated && (
              <Link href="/auth/register" style={{
                padding: "11px 28px", borderRadius: 9999,
                background: "transparent", color: "white",
                border: "1px solid rgba(255,255,255,0.5)",
                fontWeight: 600, fontSize: 14,
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: "var(--font-grotesk), system-ui, sans-serif",
                letterSpacing: "-0.01em",
                transition: "all 0.2s",
              }}>
                Join Free
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
