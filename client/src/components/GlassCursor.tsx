/**
 * GlassCursor — Premium custom magnetic cursor for desktop.
 *
 * Two-layer cursor:
 *  • Inner dot  — snaps to real mouse position instantly
 *  • Outer ring — lags behind with spring physics for depth
 *
 * Magnetic behaviour: anchors to the center of any [data-magnetic]
 * element when the mouse is within its activation radius.
 *
 * Fire burst: every click triggers a GSAP scale-up burst on the ring.
 *
 * Disabled on: touch devices, prefers-reduced-motion.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function GlassCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on touch / reduced motion
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    ) return;

    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -200, my = -200;   // start off-screen
    let rx = -200, ry = -200;   // ring position (lagged)
    let rafId: number;

    // Show cursors
    dot.style.opacity  = "1";
    ring.style.opacity = "1";

    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

    const loop = () => {
      rafId = requestAnimationFrame(loop);

      // Smooth ring toward dot
      rx = lerp(rx, mx, 0.115);
      ry = lerp(ry, my, 0.115);

      dot.style.transform  = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    };
    loop();

    const onMove = (e: MouseEvent) => {
      // Check for magnetic elements
      const magnetEl = (e.target as Element)?.closest("[data-magnetic]") as HTMLElement | null;
      if (magnetEl) {
        const rect = magnetEl.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = e.clientX - cx;
        const dy   = e.clientY - cy;
        mx = cx + dx * 0.38;
        my = cy + dy * 0.38;
        ring.style.width  = "52px";
        ring.style.height = "52px";
        ring.style.borderColor = "hsl(24 95% 60% / 0.9)";
      } else {
        mx = e.clientX;
        my = e.clientY;
        ring.style.width  = "38px";
        ring.style.height = "38px";
        ring.style.borderColor = "hsl(24 95% 55% / 0.65)";
      }
    };

    const onClick = () => {
      gsap.fromTo(ring,
        { scale: 1 },
        { scale: 1.9, opacity: 0, duration: 0.42, ease: "power2.out",
          onComplete: () => gsap.set(ring, { scale: 1, opacity: 1 }) }
      );
    };

    const onDown = () => {
      gsap.to(dot,  { scale: 0.55, duration: 0.12, ease: "power2.in" });
      gsap.to(ring, { scale: 0.70, duration: 0.12, ease: "power2.in" });
    };
    const onUp = () => {
      gsap.to(dot,  { scale: 1, duration: 0.22, ease: "elastic.out(1.2, 0.5)" });
      gsap.to(ring, { scale: 1, duration: 0.28, ease: "elastic.out(1.2, 0.5)" });
    };

    window.addEventListener("mousemove",  onMove,   { passive: true });
    window.addEventListener("click",      onClick,  { passive: true });
    window.addEventListener("mousedown",  onDown,   { passive: true });
    window.addEventListener("mouseup",    onUp,     { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("click",      onClick);
      window.removeEventListener("mousedown",  onDown);
      window.removeEventListener("mouseup",    onUp);
    };
  }, []);

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="cursor-dot"
        aria-hidden="true"
        style={{ opacity: 0 }}
      />
      {/* Outer ring with lag */}
      <div
        ref={ringRef}
        className="cursor-ring"
        aria-hidden="true"
        style={{ opacity: 0 }}
      />
    </>
  );
}
