/**
 * PageTransition — GSAP-powered cinematic route change veil.
 *
 * Renders an obsidian + fire-gradient overlay that slides in/out on
 * every location change. Pages fade+slide upward into view after the
 * veil recedes. Works with Wouter via `useLocation`.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import gsap from "gsap";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const veilRef    = useRef<HTMLDivElement>(null);
  const childRef   = useRef<HTMLDivElement>(null);
  const prevLoc    = useRef<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      prevLoc.current = location;
      return;
    }

    const veil  = veilRef.current;
    const child = childRef.current;
    if (!veil || !child) return;

    // Same location (initial mount) → just reveal content
    if (prevLoc.current === null) {
      prevLoc.current = location;
      gsap.fromTo(
        child,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }
      );
      return;
    }

    prevLoc.current = location;

    // Build timeline: veil sweeps in → tiny hold → sweeps out → content appears
    const tl = gsap.timeline();
    tl.set(veil, { scaleY: 0, transformOrigin: "bottom center", display: "block" })
      .to(veil,  { scaleY: 1, duration: 0.32, ease: "power3.in" })
      .to(veil,  { scaleY: 0, transformOrigin: "top center", duration: 0.34, ease: "power3.out", delay: 0.06 })
      .fromTo(
        child,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.42, ease: "power2.out" },
        "-=0.14"
      )
      .set(veil, { display: "none" });

    return () => { tl.kill(); };
  }, [location]);

  return (
    <>
      {/* Transition veil */}
      <div
        ref={veilRef}
        className="fixed inset-0 z-[200] pointer-events-none"
        style={{
          display: "none",
          background:
            "linear-gradient(180deg, hsl(222,20%,3%) 0%, hsl(222,20%,5%) 30%, hsl(10,80%,8%) 100%)",
        }}
        aria-hidden="true"
      />
      {/* Page content wrapper */}
      <div ref={childRef} style={{ opacity: 1 }}>
        {children}
      </div>
    </>
  );
}
