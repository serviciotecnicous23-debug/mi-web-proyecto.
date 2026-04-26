import { useEffect, useRef } from "react";

interface FireParticlesProps {
  /** Cantidad de particulas. Default 80. */
  count?: number;
  /** Si es true, respeta prefers-reduced-motion y oculta las particulas. */
  respectReducedMotion?: boolean;
  /** Clase CSS extra para el canvas (sobreescribe el default). */
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  life: number;
  maxLife: number;
  hue: number; // 0..60 (rojo a amarillo)
}

const TWO_PI = Math.PI * 2;

/**
 * Capa de particulas tipo fuego renderizada en canvas.
 * - Posicionada absolute inset-0, pointer-events:none.
 * - Se autoescala con devicePixelRatio para HiDPI.
 * - Pausa la animacion cuando el canvas no esta visible (IntersectionObserver).
 * - Respeta prefers-reduced-motion (no anima).
 *
 * Pensada para vivir dentro de un contenedor con `position: relative`
 * (ej: el <section> del hero).
 */
export default function FireParticles({
  count = 80,
  respectReducedMotion = true,
  className,
}: FireParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reduced motion: ni siquiera arrancamos.
    const reducedMotionMQ =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (respectReducedMotion && reducedMotionMQ?.matches) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const particles: Particle[] = [];

    function rand(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function spawnParticle(p: Particle, atBottom = true) {
      p.x = rand(0, width);
      p.y = atBottom ? rand(height * 0.85, height + 20) : rand(0, height);
      p.vx = rand(-0.18, 0.18);
      p.vy = rand(-1.4, -0.6); // sube
      p.baseSize = rand(2, 7);
      p.size = p.baseSize;
      p.maxLife = rand(70, 160);
      p.life = atBottom ? 0 : rand(0, p.maxLife);
      p.hue = rand(8, 55); // rojo (8) a amarillo (55)
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        const p: Particle = {
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          size: 0,
          baseSize: 0,
          life: 0,
          maxLife: 0,
          hue: 0,
        };
        spawnParticle(p, false);
        particles.push(p);
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.max(1, Math.floor(width * dpr));
      canvas!.height = Math.max(1, Math.floor(height * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    let running = true;
    let rafId = 0;

    function step() {
      if (!running) return;
      ctx!.clearRect(0, 0, width, height);
      // Modo aditivo: las particulas se suman entre si dando look de brasa.
      const prevComp = ctx!.globalCompositeOperation;
      ctx!.globalCompositeOperation = "lighter";

      for (const p of particles) {
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        // Decae el tamaño y la vida
        const lifeRatio = p.life / p.maxLife;
        p.size = p.baseSize * (1 - lifeRatio * 0.6);

        if (p.life >= p.maxLife || p.y < -10 || p.x < -20 || p.x > width + 20) {
          spawnParticle(p, true);
          continue;
        }

        // Color: arranca amarillo (alto hue), termina rojo (hue bajo).
        const hue = p.hue * (1 - lifeRatio * 0.7);
        const alpha = Math.max(0, (1 - lifeRatio) * 0.85);
        const lightness = 55 - lifeRatio * 25;

        // Halo radial para look de brasa
        const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        grad.addColorStop(0, `hsla(${hue}, 100%, ${lightness + 10}%, ${alpha})`);
        grad.addColorStop(0.5, `hsla(${hue}, 100%, ${lightness}%, ${alpha * 0.5})`);
        grad.addColorStop(1, `hsla(${hue}, 100%, ${lightness}%, 0)`);

        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * 3, 0, TWO_PI);
        ctx!.fill();

        // Nucleo brillante
        ctx!.fillStyle = `hsla(${hue + 10}, 100%, 75%, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, Math.max(0.5, p.size * 0.5), 0, TWO_PI);
        ctx!.fill();
      }

      ctx!.globalCompositeOperation = prevComp;
      rafId = window.requestAnimationFrame(step);
    }

    // Pausa cuando no es visible (ahorra CPU/bateria).
    let isInView = true;
    const visObserver =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              isInView = entry.isIntersecting;
              if (isInView && !running) {
                running = true;
                rafId = window.requestAnimationFrame(step);
              } else if (!isInView) {
                running = false;
                if (rafId) window.cancelAnimationFrame(rafId);
              }
            },
            { threshold: 0 },
          )
        : null;
    visObserver?.observe(canvas);

    // Resize observer para mantener el canvas con el tamaño del contenedor.
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }

    // Pausa si el usuario cambia de pestaña.
    function onVisibility() {
      if (document.hidden) {
        running = false;
        if (rafId) window.cancelAnimationFrame(rafId);
      } else if (isInView) {
        running = true;
        rafId = window.requestAnimationFrame(step);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    rafId = window.requestAnimationFrame(step);

    return () => {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      visObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [count, respectReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={
        className ??
        "absolute inset-0 w-full h-full pointer-events-none select-none z-0"
      }
    />
  );
}
