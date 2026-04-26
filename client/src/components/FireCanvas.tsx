/**
 * FireCanvas — Full-screen HTML5 Canvas particle engine
 *
 * Features:
 *  • Ambient embers drift upward from the bottom of the viewport
 *  • Every user click spawns a radial burst of sparks at the cursor
 *  • Particles fade, shrink, and float until dead; pool is capped for perf
 *  • Mix-blend-mode adapts to dark/light theme via CSS class
 *  • Fully disabled when prefers-reduced-motion is set
 *
 * Particle physics (per-frame, ~60 fps):
 *   vy decreases by BUOYANCY     → particles naturally rise
 *   vx/vy multiplied by DRAG     → velocity decays over time
 *   life decreases by decay      → drives opacity + size reduction
 */

import { useEffect, useRef } from 'react';

// ─────────────────────────── tunables ──────────────────────────────────────
const MAX_PARTICLES     = 200;   // hard cap to keep GPU happy
const BURST_COUNT       = 26;    // sparks per click
const EMBER_INTERVAL_MS = 450;   // ms between ambient ember spawns
const BUOYANCY          = 0.038; // upward acceleration per frame
const DRAG              = 0.982; // velocity decay multiplier
// ───────────────────────────────────────────────────────────────────────────

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  life: number;     // 0 → 1, starts at 1
  decay: number;    // life subtracted per frame
  size: number;     // base radius in px
  hue: number;      // HSL hue, 5–55 for fire spectrum
};

function makeBurst(x: number, y: number, count: number): Particle[] {
  return Array.from({ length: count }, () => {
    const angle  = Math.random() * Math.PI * 2;
    const speed  = Math.random() * 5 + 0.8;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,  // biased upward
      life: 1,
      decay: Math.random() * 0.025 + 0.012,
      size: Math.random() * 3.5 + 0.8,
      hue: Math.random() * 45 + 8,      // 8–53° → red-orange-amber
    };
  });
}

function makeEmber(canvasWidth: number, canvasHeight: number): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: canvasHeight + 6,
    vx: (Math.random() - 0.5) * 0.9,
    vy: -(Math.random() * 1.6 + 0.4),   // starts moving upward
    life: 1,
    decay: Math.random() * 0.004 + 0.002,
    size: Math.random() * 1.8 + 0.4,
    hue: Math.random() * 35 + 18,       // 18–53° → orange-amber
  };
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const radius    = Math.max(0.1, p.size * p.life);
  const lightness = 48 + (1 - p.life) * 32; // start deeper, get lighter as it dies
  const alpha     = Math.min(0.9, p.life * 1.1);

  ctx.save();
  ctx.globalAlpha    = alpha;
  ctx.shadowColor    = `hsl(${p.hue}, 100%, 58%)`;
  ctx.shadowBlur     = radius * 5;
  ctx.fillStyle      = `hsl(${p.hue}, 100%, ${lightness}%)`;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function FireCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect accessibility preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let raf: number;
    let lastEmberTime = 0;
    const isMobile = window.innerWidth < 768;

    // ── Resize handler ───────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Click → burst ────────────────────────────────────────────────
    const onClick = (e: MouseEvent) => {
      const count = isMobile ? Math.floor(BURST_COUNT * 0.6) : BURST_COUNT;
      if (particles.length < MAX_PARTICLES) {
        particles.push(...makeBurst(e.clientX, e.clientY, count));
      }
    };
    window.addEventListener('click', onClick);

    // ── Main render loop ─────────────────────────────────────────────
    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn ambient ember periodically
      const interval = isMobile ? EMBER_INTERVAL_MS * 2 : EMBER_INTERVAL_MS;
      if (time - lastEmberTime > interval && particles.length < MAX_PARTICLES) {
        lastEmberTime = time;
        if (Math.random() > 0.25) {
          particles.push(makeEmber(canvas.width, canvas.height));
        }
      }

      // Update → filter dead → draw
      particles = particles.filter(p => {
        p.life -= p.decay;
        if (p.life <= 0) return false;

        // Physics
        p.vy  -= BUOYANCY;
        p.vx  *= DRAG;
        p.vy  *= DRAG;
        p.x   += p.vx;
        p.y   += p.vy;

        drawParticle(ctx, p);
        return true;
      });

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fire-canvas fixed inset-0 pointer-events-none"
      style={{ zIndex: 9998 }}
      aria-hidden="true"
    />
  );
}
