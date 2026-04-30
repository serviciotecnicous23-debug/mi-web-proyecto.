import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Flame, Radio, Users, BookOpen, Heart, Globe, HandCoins, Video, Signal, Church, Shield, Award, LogIn, UserPlus, Headphones, Smartphone } from "lucide-react";
import { PublicDonationSection } from "@/pages/finanzas";
import { LogoIcon } from "@/components/LogoIcon";
import { FlameLogoSVG } from "@/components/FlameLogoSVG";
import { RadioInstallActions } from "@/components/RadioInstallActions";
import AnimatedSection from "@/components/AnimatedSection";
import FireParticles from "@/components/FireParticles";

const stats = [
  { label: "Anos de Servicio", value: "7+" },
  { label: "Paises", value: "3" },
  { label: "Iglesias Aliadas", value: "10+" },
  { label: "Vidas Impactadas", value: "1000+" },
];

const areas = [
  { icon: Flame, title: "Evangelismo Callejero", desc: "Alcanzando vidas en plazas, parques y hogares con el mensaje de salvacion." },
  { icon: Radio, title: "Medios Digitales", desc: "Radio, podcasts, YouTube y redes sociales llevando el evangelio a todo lugar." },
  { icon: Heart, title: "Obras Sociales", desc: "Ayuda humanitaria, jornadas comunitarias y apoyo a los necesitados." },
  { icon: BookOpen, title: "Formacion de Lideres", desc: "Escuela de ministerio, discipulado y capacitacion de obreros fieles." },
  { icon: Users, title: "Retiros y Encuentros", desc: "Vigilias, campamentos, congresos y tiempos de avivamiento espiritual." },
  { icon: Globe, title: "Misiones Internacionales", desc: "Expansion del ministerio a nuevas naciones y culturas." },
];

export default function Home() {
  const { user } = useAuth();
  const ctaRef = useRef<HTMLDivElement>(null);

  // GSAP magnetic hover physics on hero CTAs
  useEffect(() => {
    const container = ctaRef.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const buttons = container.querySelectorAll("button");
    const cleanups: (() => void)[] = [];

    buttons.forEach((btn) => {
      const enter = () => {
        gsap.to(btn, { scale: 1.06, y: -3, duration: 0.35, ease: "power2.out" });
        gsap.to(btn, { "--fire-glow": "1", duration: 0.28, ease: "power2.out" });
      };
      const leave = () => {
        gsap.to(btn, { scale: 1, y: 0, duration: 0.55, ease: "elastic.out(1.15, 0.5)" });
      };
      const down = () => gsap.to(btn, { scale: 0.94, duration: 0.1, ease: "power2.in" });
      const up   = () => gsap.to(btn, { scale: 1.06, duration: 0.25, ease: "power2.out" });

      btn.addEventListener("mouseenter", enter, { passive: true });
      btn.addEventListener("mouseleave", leave, { passive: true });
      btn.addEventListener("mousedown",  down,  { passive: true });
      btn.addEventListener("mouseup",    up,    { passive: true });

      cleanups.push(() => {
        btn.removeEventListener("mouseenter", enter);
        btn.removeEventListener("mouseleave", leave);
        btn.removeEventListener("mousedown",  down);
        btn.removeEventListener("mouseup",    up);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [user]);

  return (
    <Layout>
      <AnimatedSection>
        <section className="relative overflow-hidden py-28 md:py-40">
          <FireParticles />
          {/* Obsidian grid overlay */}
          <div className="hero-grid-bg absolute inset-0" />
          <div className="absolute inset-0 fire-gradient opacity-10 dark:opacity-20" />
          {/* Heat distortion zone — lower 35% of hero only */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[35%] pointer-events-none"
            style={{ filter: "url(#heat-distortion)" }}
            aria-hidden="true"
          />
          <motion.div
            className="relative max-w-4xl mx-auto px-4 text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            {/* Pill tag */}
            <span className="glass-pill inline-block mb-6 text-xs">
              &nbsp;Desde 2017 &bull; Ciudad Bolivar, Venezuela&nbsp;
            </span>

            {/* Animated logo */}
            <div className="flame-logo-wrap mx-auto mb-6 w-28 h-28 md:w-36 md:h-36 flex items-center justify-center">
              <FlameLogoSVG className="w-full h-full" animate />
            </div>

            {/* Glassmorphism contrast well — ensures heading legibility against WebGL fire */}
            <div className="hero-text-well mx-auto max-w-3xl px-6 py-8 md:px-10 md:py-10 mb-8">
              <h1
                className="heading-display font-display text-6xl md:text-8xl lg:text-9xl mb-4 leading-none"
                data-testid="text-title"
              >
                <span className="fire-text">AVIVANDO</span>
                <br />
                <span className="text-foreground/90 dark:text-white/90">EL FUEGO</span>
              </h1>
              <blockquote className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-2 italic">
                "Para que vuestra fe no este fundada en la sabiduria de los hombres, sino en el poder de Dios"
              </blockquote>
              <p className="text-sm text-muted-foreground">— 1 Corintios 2:4</p>
            </div>

            {/* CTAs — GSAP hover physics applied via ctaRef */}
            <div ref={ctaRef} className="flex flex-wrap justify-center gap-4">
              <Link href="/radio">
                <Button size="lg" className="fire-btn-primary" data-testid="button-hero-radio" data-magnetic>
                  <Radio className="w-4 h-4 mr-2" />
                  Escuchar Radio
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="btn-fire-glow" data-testid="button-hero-login" data-magnetic>
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesion
                </Button>
              </Link>
              <Link href="/registro">
                <Button variant="outline" size="lg" className="btn-fire-glow" data-testid="button-hero-register" data-magnetic>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrarse
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </AnimatedSection>

      {/* Stats */}
      <section className="py-14 border-t border-border/40">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="glass-card text-center py-6 px-4"
              data-testid={`stat-${s.value}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <p className="font-display text-4xl md:text-5xl font-bold fire-text">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-2 tracking-wide uppercase">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Radio App Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="glass-card neon-border-fire overflow-hidden">
            <div className="grid gap-8 p-6 md:grid-cols-[1fr_0.72fr] md:p-9 lg:p-12">
              <div className="flex flex-col justify-center">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                    <Headphones className="h-6 w-6 text-primary" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Radio oficial</p>
                    <h2 className="heading-display font-display text-4xl md:text-5xl">Avivando el Fuego Radio</h2>
                  </div>
                </div>
                <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                  La emisora ya transmite desde el servidor propio de AzuraCast con adoracion, alabanza, predicas y contenido ministerial nuevo.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="/radio">
                    <Button size="lg" className="fire-btn-primary w-full sm:w-auto" data-testid="button-home-radio">
                      <Radio className="h-4 w-4" />
                      Abrir Radio
                    </Button>
                  </Link>
                  <Link href="/radio-live-scene">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-home-radio-scene">
                      <Video className="h-4 w-4" />
                      Escena TikTok
                    </Button>
                  </Link>
                </div>
                <div className="mt-4">
                  <RadioInstallActions url="https://ministerioavivandoelfuego.com/radio" compact />
                </div>
              </div>
              <div className="rounded-md border bg-background/70 p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Signal className="h-5 w-5 text-primary" />
                    <span className="font-semibold">24/7 online</span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">AzuraCast</span>
                </div>
                <div className="space-y-4">
                  {[
                    ["Nueva adoracion", "Ministracion y busqueda de la presencia de Dios."],
                    ["Predicas nuevas", "Mensajes y ensenanzas programadas en la rotacion."],
                    ["App instalable", "Acceso directo desde la pantalla de inicio del telefono."],
                  ].map(([title, text]) => (
                    <div key={title} className="flex gap-3 rounded-md border bg-card/70 p-4">
                      <Smartphone className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <h3 className="font-bold">{title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Areas */}
      <section className="py-16 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="glass-pill inline-block mb-4 text-xs">Nuestro Trabajo</span>
            <h2 className="heading-display font-display text-4xl md:text-5xl">Areas de Accion</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Multiples frentes de batalla espiritual, un solo objetivo: llevar el fuego del evangelio a toda criatura.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((a, i) => (
              <motion.div
                key={a.title}
                className="glass-card p-6"
                data-testid={`card-area-${a.title}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
              >
                <a.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-display text-sm font-semibold tracking-wider uppercase mb-2">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* En Vivo Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="glass-pill inline-block mb-4 text-xs">Transmisiones</span>
            <h2 className="heading-display font-display text-4xl md:text-5xl">En Vivo</h2>
          </div>
          <div className="glass-card neon-border-fire p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Signal className="h-12 w-12 text-primary" />
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-wider uppercase">Transmisiones del Ministerio</h3>
                  <p className="text-sm text-muted-foreground">Radio &bull; YouTube &bull; Facebook &bull; Podcast</p>
                </div>
              </div>
              <div className="flex-1" />
              <Link href="/en-vivo">
                <Button size="lg" className="gap-2 fire-btn-primary" data-magnetic>
                  <Video className="h-4 w-4" /> Ver En Vivo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Alianza Global Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="glass-pill inline-block mb-4 text-xs">Alianza para la Gran Comision</span>
            <h2 className="heading-display font-display text-4xl md:text-5xl">Una Red de Iglesias Unidas</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              No somos cobertura, somos companeros de yugo. Iglesias autonomas unidas por el mismo fuego,
              compartiendo recursos, formacion y proposito.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              { icon: Church, title: "Iglesias Aliadas", desc: "Cada congregacion mantiene su autonomia pastoral mientras accede a recursos compartidos." },
              { icon: Award,  title: "Formacion Ministerial", desc: "Cursos nucleares del ministerio mas formacion propia. Certificacion conjunta." },
              { icon: Shield, title: "Canalizacion Etica", desc: "Miembros conectados con iglesias locales. Sin proselitismo, con transparencia." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="glass-card p-7 text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <item.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-display text-sm font-semibold tracking-widest uppercase mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/alianza">
              <Button size="lg" className="fire-btn-primary" data-magnetic>
                <Church className="w-4 h-4 mr-2" /> Eres Pastor? Unete a la Alianza
              </Button>
            </Link>
            <Link href="/buscar-iglesia">
              <Button size="lg" variant="outline" data-magnetic>
                Buscar una Iglesia Cercana
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="glass-pill inline-block mb-4 text-xs">Apoyo</span>
            <h2 className="heading-display font-display text-4xl md:text-5xl">Apoya el Ministerio</h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Tu generosidad hace posible que el fuego del evangelio siga llegando a mas personas.
            </p>
          </div>
          <PublicDonationSection />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="glass-card neon-border-fire p-12">
            <h2 className="heading-display font-display text-4xl md:text-5xl mb-6">
              Sientes el <span className="fire-text">Llamado?</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Unete como miembro, maestro o iglesia aliada. Juntos llevamos el fuego del evangelio a las naciones.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/registro">
                <Button size="lg" className="fire-btn-primary px-8" data-testid="button-cta-join" data-magnetic>
                  Ser Parte del Equipo
                </Button>
              </Link>
              <Link href="/ficha-ministerial">
                <Button size="lg" variant="outline" data-magnetic>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Directorio de Maestros
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
