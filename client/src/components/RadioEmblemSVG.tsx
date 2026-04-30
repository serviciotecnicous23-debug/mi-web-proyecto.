import { useEffect, useId, useRef } from "react";
import gsap from "gsap";

interface RadioEmblemSVGProps {
  className?: string;
  animate?: boolean;
}

export function RadioEmblemSVG({ className = "h-20 w-20", animate = true }: RadioEmblemSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const signalRef = useRef<SVGGElement>(null);
  const waveLeftRef = useRef<SVGGElement>(null);
  const waveRightRef = useRef<SVGGElement>(null);
  const flameRef = useRef<SVGGElement>(null);
  const emberRef = useRef<SVGCircleElement>(null);
  const rawId = useId().replace(/:/g, "");
  const ids = {
    bg: `${rawId}-aef-emblem-bg`,
    flame: `${rawId}-aef-emblem-flame`,
    core: `${rawId}-aef-emblem-core`,
    gold: `${rawId}-aef-emblem-gold`,
    steel: `${rawId}-aef-emblem-steel`,
    glow: `${rawId}-aef-emblem-glow`,
  };

  useEffect(() => {
    if (!animate) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.to(signalRef.current, {
        opacity: 0.48,
        scale: 1.035,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "80px 72px",
      });

      gsap.to([waveLeftRef.current, waveRightRef.current], {
        scale: 1.06,
        opacity: 0.58,
        duration: 1.55,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "80px 82px",
        stagger: 0.18,
      });

      gsap.to(flameRef.current, {
        scaleY: 1.05,
        scaleX: 0.985,
        y: -1.5,
        duration: 1.85,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "80px 124px",
      });

      gsap.to(emberRef.current, {
        scale: 1.22,
        opacity: 0.62,
        duration: 0.92,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformOrigin: "80px 112px",
      });
    }, svgRef);

    return () => ctx.revert();
  }, [animate]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 160 160"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Avivando el Fuego Radio"
    >
      <defs>
        <linearGradient id={ids.bg} x1="18%" y1="8%" x2="82%" y2="100%">
          <stop offset="0%" stopColor="#3b170c" />
          <stop offset="45%" stopColor="#120807" />
          <stop offset="100%" stopColor="#050202" />
        </linearGradient>
        <linearGradient id={ids.steel} x1="15%" y1="0%" x2="88%" y2="100%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="30%" stopColor="#f59e0b" />
          <stop offset="62%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        <linearGradient id={ids.flame} x1="40%" y1="8%" x2="66%" y2="100%">
          <stop offset="0%" stopColor="#fff7ad" />
          <stop offset="26%" stopColor="#fbbf24" />
          <stop offset="58%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <linearGradient id={ids.core} x1="50%" y1="20%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#fffef3" />
          <stop offset="52%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id={ids.gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="38%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <filter id={ids.glow} x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0.28 0 0 0.08  0.18 0.11 0 0 0.02  0 0 0 0 0  0 0 0 1.5 0"
            result="warm"
          />
          <feMerge>
            <feMergeNode in="warm" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d="M80 11c21 12 43 12 58 22 0 47-17 87-58 115-41-28-58-68-58-115 15-10 37-10 58-22z"
        fill={`url(#${ids.bg})`}
        stroke={`url(#${ids.steel})`}
        strokeWidth="3.6"
        strokeLinejoin="round"
      />
      <path
        d="M80 22c17 9 35 10 47 18-2 38-16 69-47 93-31-24-45-55-47-93 12-8 30-9 47-18z"
        fill="rgba(255,247,237,.035)"
        stroke="rgba(254,215,170,.16)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <g ref={signalRef} opacity="0.78">
        <path d="M50 45c17-15 43-15 60 0" fill="none" stroke={`url(#${ids.gold})`} strokeWidth="3.3" strokeLinecap="round" />
        <path d="M60 57c11-9 29-9 40 0" fill="none" stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" opacity=".64" />
        <path d="M80 29v17M71.5 37.5h17" stroke="#fff7ed" strokeWidth="3" strokeLinecap="round" opacity=".78" />
      </g>

      <g ref={waveLeftRef} fill="none" stroke={`url(#${ids.gold})`} strokeLinecap="round" opacity="0.82">
        <path d="M50 72c-7 8-7 22 0 30" strokeWidth="5" />
        <path d="M38 62c-13 17-13 50 0 67" strokeWidth="4" opacity="0.48" />
      </g>

      <g ref={waveRightRef} fill="none" stroke={`url(#${ids.gold})`} strokeLinecap="round" opacity="0.82">
        <path d="M110 72c7 8 7 22 0 30" strokeWidth="5" />
        <path d="M122 62c13 17 13 50 0 67" strokeWidth="4" opacity="0.48" />
      </g>

      <g ref={flameRef} filter={`url(#${ids.glow})`}>
        <path
          d="M82 47c8 15 25 26 25 49 0 20-13 34-27 38-15-4-27-18-27-38 0-17 10-29 19-42 4-6 7-10 10-7z"
          fill={`url(#${ids.flame})`}
        />
        <path
          d="M81 70c8 10 15 18 15 31 0 11-7 20-16 23-10-3-16-11-16-23 0-12 8-21 17-31z"
          fill={`url(#${ids.core})`}
          opacity="0.96"
        />
        <path d="M80 89v20" stroke="#6b1d09" strokeWidth="5" strokeLinecap="round" opacity=".25" />
        <path d="M70 111h20" stroke="#fff7ed" strokeWidth="4" strokeLinecap="round" opacity=".72" />
        <circle ref={emberRef} cx="80" cy="112" r="6.5" fill="#fff7ed" opacity=".88" />
      </g>

      <path d="M58 130h44" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" opacity=".36" />
    </svg>
  );
}
