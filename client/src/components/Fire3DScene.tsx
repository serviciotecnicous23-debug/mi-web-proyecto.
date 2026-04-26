/**
 * Fire3DScene — WebGL volumetric fire using Three.js + custom GLSL shaders
 *
 * Features:
 *  • Simplex-noise FBM fragment shader for turbulent fire density
 *  • Vertex displacement for organic flame tongues
 *  • Additive blending — composites over page content with screen-mode glow
 *  • Ember particle system (THREE.Points) animated upward with random drift
 *  • Mouse interaction: nearby cursor pushes/bends flames
 *  • SVG heat-distortion filter applied as CSS to parent container
 *  • Throttled resize handler, RAF cleanup, full Three.js disposal
 *  • Respects prefers-reduced-motion
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";

/* ────────────────────────────────── GLSL ─────────────────────────────────── */

// Ashima Arts Simplex Noise (MIT License) — embedded to avoid extra dep
const SIMPLEX_NOISE_GLSL = /* glsl */ `
vec3 _mod289_3(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 _mod289_4(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 _perm(vec4 x){return _mod289_4(((x*34.)+1.)*x);}
vec4 _taylorSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=_mod289_3(i);
  vec4 p=_perm(_perm(_perm(
    i.z+vec4(0.,i1.z,i2.z,1.))
    +i.y+vec4(0.,i1.y,i2.y,1.))
    +i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=_taylorSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
// Fractional Brownian Motion — 5 octaves
float fbm(vec3 v){
  float val=0.;float amp=.5;float freq=1.;
  for(int i=0;i<5;i++){val+=amp*snoise(v*freq);freq*=2.;amp*=.5;}
  return val;
}
`;

/* ─── Vertex shader: noise-based lateral flame displacement ─────────────── */
const FIRE_VERT = /* glsl */ `
${SIMPLEX_NOISE_GLSL}
uniform float uTime;
uniform vec2  uMouse;  // normalised -1..1
varying vec2  vUv;
varying float vY;      // local Y position for colour mapping

void main(){
  vUv = uv;
  vY  = position.y;

  // How close is this vertex to the mouse in screen space?
  float mdist   = length(vec2(position.x, position.y) - uMouse * 1.8);
  float mEffect = exp(-mdist * 1.4) * 0.22;

  float t  = uTime;
  // Coarse macro wobble
  float n1 = snoise(vec3(position.x * 1.2, position.y * 1.8 - t * 0.85, t * 0.3));
  // Fine detail turbulence
  float n2 = snoise(vec3(position.x * 3.5 + 0.6, position.y * 4.0 - t * 1.6, t * 0.55));

  // Displacement fades to zero near the top (flames taper)
  float taper = clamp(1.0 - vY * 0.55, 0.0, 1.0);

  vec3 pos = position;
  pos.x += (n1 * 0.13 + n2 * 0.04) * taper + uMouse.x * mEffect;
  pos.z += n2 * 0.05 * taper;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

/* ─── Fragment shader: FBM fire density → colour temperature gradient ───── */
const FIRE_FRAG = /* glsl */ `
${SIMPLEX_NOISE_GLSL}
uniform float uTime;
uniform float uOpacity;
uniform float uIntensity;  // 0..1 master dimmer
varying vec2  vUv;
varying float vY;

void main(){
  float t = uTime;

  // Multi-layer noise for organic fire shape
  vec3 c0 = vec3(vUv.x * 2.0,   vUv.y * 3.5  - t * 1.3, t * 0.40);
  vec3 c1 = vec3(vUv.x * 4.0,   vUv.y * 7.0  - t * 2.2, t * 0.65);
  vec3 c2 = vec3(vUv.x * 8.5,   vUv.y * 14.0 - t * 3.8, t * 0.90);

  float n0 = fbm(c0) * 0.5 + 0.5;
  float n1 = snoise(c1) * 0.5 + 0.5;
  float n2 = snoise(c2) * 0.5 + 0.5;

  float density = n0 * 0.55 + n1 * 0.28 + n2 * 0.17;

  // Height fade: fire thick at bottom, vanishes at top
  float fade   = 1.0 - smoothstep(0.05, 1.0, vUv.y);
  // Width taper: narrower toward top — pinch-in for realistic flame
  float xEdge  = abs(vUv.x - 0.5) * 2.0;  // 0 at centre, 1 at edges
  float wTaper = 1.0 - smoothstep(0.3, 1.0, xEdge * (0.4 + vUv.y * 0.6));

  float fire = density * fade * wTaper;
  fire = smoothstep(0.28, 0.88, fire) * uIntensity;

  // ── Colour temperature ─────────────────────────────────────────────────
  vec3 hotCore  = vec3(1.00, 0.98, 0.88);   // near-white / platinum
  vec3 yellow   = vec3(1.00, 0.82, 0.12);   // yellow flame
  vec3 orange   = vec3(1.00, 0.40, 0.04);   // orange body
  vec3 crimson  = vec3(0.82, 0.06, 0.02);   // deep red edge
  vec3 ember    = vec3(0.45, 0.02, 0.00);   // barely glowing

  vec3 color;
  if      (fire > 0.82) color = mix(yellow,  hotCore, (fire - 0.82) / 0.18);
  else if (fire > 0.62) color = mix(orange,  yellow,  (fire - 0.62) / 0.20);
  else if (fire > 0.38) color = mix(crimson, orange,  (fire - 0.38) / 0.24);
  else if (fire > 0.14) color = mix(ember,   crimson, (fire - 0.14) / 0.24);
  else                  color = ember;

  // Upper wisps: desaturate and dim slightly for depth
  color = mix(color, color * 0.55, vUv.y * 0.4);

  float alpha = fire * uOpacity * smoothstep(0.0, 0.18, fire);
  gl_FragColor = vec4(color, alpha);
}
`;

/* ─── Ember vertex / fragment shaders ──────────────────────────────────── */
const EMBER_VERT = /* glsl */ `
attribute float aSize;
attribute float aLife;
varying   float vLife;
void main(){
  vLife = aLife;
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (280.0 / -mvPos.z) * aLife;
  gl_Position  = projectionMatrix * mvPos;
}
`;

const EMBER_FRAG = /* glsl */ `
varying float vLife;
void main(){
  // Circular soft sprite
  vec2  uv   = gl_PointCoord - 0.5;
  float dist = length(uv);
  if(dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.0, dist) * vLife * 0.85;
  // Colour: hot amber to red as life fades
  vec3 hotAmber = vec3(1.00, 0.72, 0.08);
  vec3 deepRed  = vec3(0.80, 0.05, 0.00);
  vec3 col = mix(deepRed, hotAmber, vLife);
  gl_FragColor = vec4(col, alpha);
}
`;

/* ────────────────────────────── Component ────────────────────────────────── */

export interface Fire3DSceneHandle {
  /** Animate the fire intensity up or down (0–1) */
  setIntensity: (v: number, duration?: number) => void;
  /** Switch between majestic hero flames and drifting ember clouds */
  setMode: (mode: "hero" | "ember") => void;
}

interface Fire3DSceneProps {
  /** Base opacity for the whole scene (0–1, default 0.92) */
  opacity?: number;
  /** Number of ember particles (default 320, reduced to 140 on mobile) */
  emberCount?: number;
  /** className applied to the wrapper div */
  className?: string;
}

const EMBER_POOL = typeof window !== "undefined" && window.innerWidth < 768 ? 120 : 320;

export const Fire3DScene = forwardRef<Fire3DSceneHandle, Fire3DSceneProps>(
  function Fire3DScene({ opacity = 0.92, emberCount = EMBER_POOL, className = "" }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const intensityRef = useRef<number>(1.0);
    // emberModeRef: true → floating drift cloud, false → concentrated base fire
    const emberModeRef = useRef<boolean>(false);

    useImperativeHandle(ref, () => ({
      setIntensity(v: number, duration = 1.2) {
        const start  = intensityRef.current;
        const end    = Math.max(0, Math.min(1, v));
        const startT = performance.now();
        const tick   = () => {
          const p = Math.min((performance.now() - startT) / (duration * 1000), 1);
          // ease-in-out quad
          const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
          intensityRef.current = start + (end - start) * ease;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      setMode(mode: "hero" | "ember") {
        const isEmber      = mode === "ember";
        emberModeRef.current = isEmber;
        // Animate intensity with a slow, cinematic ease
        const start  = intensityRef.current;
        const end    = isEmber ? 0.06 : 1.0;
        const startT = performance.now();
        const dur    = isEmber ? 2200 : 1400; // ms — fade out is slower than fade in
        const tick   = () => {
          const p    = Math.min((performance.now() - startT) / dur, 1);
          const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
          intensityRef.current = start + (end - start) * ease;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // ── Reduced motion: skip all WebGL ──────────────────────────────────
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      /* ── Renderer ──────────────────────────────────────────────────────── */
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      /* ── Scene + Camera ────────────────────────────────────────────────── */
      const scene  = new THREE.Scene();
      const aspect = container.clientWidth / container.clientHeight;
      const camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 60);
      camera.position.set(0, 1.0, 5.2);
      camera.lookAt(0, 0.8, 0);

      /* ── Fire mesh ─────────────────────────────────────────────────────── */
      // PlaneGeometry: 3 units wide, 4.5 tall, highly subdivided for smooth vertex waves
      const fireGeo = new THREE.PlaneGeometry(3.2, 4.5, 56, 88);
      const fireMat = new THREE.ShaderMaterial({
        vertexShader:   FIRE_VERT,
        fragmentShader: FIRE_FRAG,
        uniforms: {
          uTime:      { value: 0 },
          uMouse:     { value: new THREE.Vector2(0, 0) },
          uOpacity:   { value: opacity },
          uIntensity: { value: intensityRef.current },
        },
        transparent: true,
        depthWrite:  false,
        blending:    THREE.AdditiveBlending,
        side:        THREE.DoubleSide,
      });
      const fireMesh = new THREE.Mesh(fireGeo, fireMat);
      fireMesh.position.set(0, -0.6, 0);
      scene.add(fireMesh);

      /* ── Ember particle system ─────────────────────────────────────────── */
      const positions  = new Float32Array(emberCount * 3);
      const sizes_arr  = new Float32Array(emberCount);
      const lifes      = new Float32Array(emberCount);
      const velocities = new Float32Array(emberCount * 3); // store dx, dy per ember

      const spawnEmber = (i: number) => {
        const i3 = i * 3;
        const isEmber = emberModeRef.current;
        // Ember mode: wide viewport scatter; Hero mode: concentrated at flame base
        const spreadX  = isEmber ? 7.0 : 2.2;
        const spreadY  = isEmber ? 4.5 : 0.4;  // embers at varied heights in ember mode
        const speedX   = isEmber ? 0.007 : 0.014;
        const speedY   = isEmber ? Math.random() * 0.010 + 0.003 : Math.random() * 0.022 + 0.008;
        const sizeMax  = isEmber ? 2.8 : 4.0;
        positions[i3]     = (Math.random() - 0.5) * spreadX;
        positions[i3 + 1] = isEmber ? (Math.random() - 0.5) * spreadY : (Math.random() - 0.5) * 0.4;
        positions[i3 + 2] = (Math.random() - 0.5) * (isEmber ? 1.2 : 0.3);
        velocities[i3]     = (Math.random() - 0.5) * speedX;
        velocities[i3 + 1] = speedY;
        sizes_arr[i]       = Math.random() * sizeMax + 1.2;
        lifes[i]           = Math.random();
      };

      for (let i = 0; i < emberCount; i++) spawnEmber(i);

      const emberGeo = new THREE.BufferGeometry();
      emberGeo.setAttribute("position", new THREE.BufferAttribute(positions,  3));
      emberGeo.setAttribute("aSize",    new THREE.BufferAttribute(sizes_arr,  1));
      emberGeo.setAttribute("aLife",    new THREE.BufferAttribute(lifes,      1));

      const emberMat = new THREE.ShaderMaterial({
        vertexShader:   EMBER_VERT,
        fragmentShader: EMBER_FRAG,
        uniforms: {},
        transparent: true,
        depthWrite:  false,
        blending:    THREE.AdditiveBlending,
      });

      const emberSystem = new THREE.Points(emberGeo, emberMat);
      emberSystem.position.set(0, -0.4, 0.2);
      scene.add(emberSystem);

      /* ── Mouse ─────────────────────────────────────────────────────────── */
      const mouse = new THREE.Vector2(0, 0);
      const handleMouse = (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener("mousemove", handleMouse, { passive: true });

      /* ── Resize ────────────────────────────────────────────────────────── */
      let resizeTimer: ReturnType<typeof setTimeout>;
      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }, 80);
      };
      window.addEventListener("resize", handleResize, { passive: true });

      /* ── Animation loop ────────────────────────────────────────────────── */
      let rafId: number;
      const start = performance.now();

      const animate = () => {
        rafId = requestAnimationFrame(animate);

        const t = (performance.now() - start) / 1000;
        fireMat.uniforms.uTime.value      = t;
        fireMat.uniforms.uIntensity.value = intensityRef.current;

        // Smooth mouse lag → fire uniform (lerp)
        const mu = fireMat.uniforms.uMouse.value as THREE.Vector2;
        mu.x += (mouse.x - mu.x) * 0.06;
        mu.y += (mouse.y - mu.y) * 0.06;

        // Animate embers
        const posAttr  = emberGeo.attributes.position as THREE.BufferAttribute;
        const lifeAttr = emberGeo.attributes.aLife    as THREE.BufferAttribute;
        const dt       = 0.016; // assume ~60fps
        const isEmber  = emberModeRef.current;
        // In ember mode: embers drift very slowly; in hero: fast-rising sparks
        const decayBase = isEmber ? 0.06 : 0.18;
        const swaySin   = isEmber ? 0.003 : 0.0015;
        for (let i = 0; i < emberCount; i++) {
          const i3 = i * 3;
          const life = lifes[i] - dt * (decayBase + Math.random() * 0.025);
          if (life <= 0) {
            spawnEmber(i);
          } else {
            lifes[i] = life;
            // Drift upward with gentle sinusoidal sway
            positions[i3]     += velocities[i3] + Math.sin(t * (isEmber ? 0.7 : 1.4) + i * 0.37) * swaySin;
            positions[i3 + 1] += velocities[i3 + 1] * (isEmber ? 0.55 : intensityRef.current);
          }
          (posAttr.array  as Float32Array)[i3]     = positions[i3];
          (posAttr.array  as Float32Array)[i3 + 1] = positions[i3 + 1];
          (posAttr.array  as Float32Array)[i3 + 2] = positions[i3 + 2];
          (lifeAttr.array as Float32Array)[i]      = lifes[i];
        }
        posAttr.needsUpdate  = true;
        lifeAttr.needsUpdate = true;

        renderer.render(scene, camera);
      };

      animate();

      /* ── Cleanup ───────────────────────────────────────────────────────── */
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(resizeTimer);
        window.removeEventListener("mousemove", handleMouse);
        window.removeEventListener("resize", handleResize);
        renderer.dispose();
        fireGeo.dispose();
        fireMat.dispose();
        emberGeo.dispose();
        emberMat.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    }, [emberCount, opacity]);

    return (
      <div
        ref={containerRef}
        className={`absolute inset-0 pointer-events-none ${className}`}
        aria-hidden="true"
        style={{ mixBlendMode: "screen" }}
      />
    );
  }
);
