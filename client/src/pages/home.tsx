import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Flame, Radio, Users, BookOpen, Heart, Globe, HandCoins, Video, Signal, Church, Shield, Award } from "lucide-react";
import { PublicDonationSection } from "@/pages/finanzas";
import { LogoIcon } from "@/components/LogoIcon";
import { FlameLogoSVG } from "@/components/FlameLogoSVG";
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

  return (
    <Layout>
      <AnimatedSection>
        <section className="relative overflow-hidden py-28 md:py-40">
          <FireParticles />
          {/* Obsidian grid overlay */}
          <div className="hero-grid-bg" />
          <div className="absolute inset-0 fire-gradient opacity-10 dark:opacity-20" />
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

            {/* Big Oswald heading */}
            <h1
              className="heading-display font-display text-6xl md:text-8xl lg:text-9xl mb-4 leading-none"
              data-testid="text-title"
            >
              <span className="fire-text">AVIVANDO</span>
              <br />
              <span className="text-foreground/80">EL FUEGO</span>
            </h1>

            <blockquote className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-2 italic">
              "Para que vuestra fe no este fundada en la sabiduria de los hombres, sino en el poder de Dios"
            </blockquote>
            <p className="text-sm text-muted-foreground mb-10">— 1 Corintios 2:4</p>

            <div className="flex flex-wrap justify-center gap-3">
              {user ? (
                <Link href="/perfil">
                  <Button size="lg" data-testid="button-hero-profile">
                    <LogoIcon className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Button>
                </Link>
              ) : (
                <Link href="/registro">
                  <Button size="lg" className="fire-btn-primary" data-testid="button-hero-join">
                    <LogoIcon className="w-4 h-4 mr-2" />
                    Unirse al Ministerio
                  </Button>
                </Link>
              )}
              <Link href="/historia">
                <Button variant="outline" size="lg" data-testid="button-hero-vision">
                  Conocer la Vision
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
      <section className="py-16 border-t">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-sm text-primary font-medium mb-2">Transmisiones</p>
            <h2 className="text-3xl font-bold">En Vivo</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Conéctate a nuestras transmisiones en vivo. Cultos, enseñanzas y más.
            </p>
          </div>
          <Card className="p-6 bg-gradient-to-br from-red-50/50 to-orange-50/30 dark:from-red-950/20 dark:to-orange-950/10 border-red-200/50">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Signal className="h-10 w-10 text-red-500" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Transmisiones del Ministerio</h3>
                  <p className="text-sm text-muted-foreground">Radio, YouTube, Facebook y más</p>
                </div>
              </div>
              <div className="flex-1" />
              <Link href="/en-vivo">
                <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700">
                  <Video className="h-4 w-4" /> Ver En Vivo
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Alianza Global Section */}
      <section className="py-16 bg-card border-t">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm text-primary font-medium mb-2">Alianza para la Gran Comision</p>
            <h2 className="text-3xl font-bold">Una Red de Iglesias Unidas</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              No somos cobertura, somos companeros de yugo. Iglesias autonomas unidas por el mismo fuego,
              compartiendo recursos, formacion y proposito.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="p-6 text-center">
              <Church className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Iglesias Aliadas</h3>
              <p className="text-sm text-muted-foreground">
                Cada congregacion mantiene su autonomia pastoral y administrativa mientras accede a recursos compartidos.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <Award className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Formacion Ministerial</h3>
              <p className="text-sm text-muted-foreground">
                Cursos nucleares del ministerio mas formacion propia de cada iglesia. Certificacion conjunta.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Canalizacion Etica</h3>
              <p className="text-sm text-muted-foreground">
                Miembros independientes conectados con iglesias locales. Sin proselitismo, con transparencia.
              </p>
            </Card>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/alianza">
              <Button size="lg" variant="default">
                <Church className="w-4 h-4 mr-2" />
                Eres Pastor? Unete a la Alianza
              </Button>
            </Link>
            <Link href="/buscar-iglesia">
              <Button size="lg" variant="outline">
                Buscar una Iglesia Cercana
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-16 border-t">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-sm text-primary font-medium mb-2">Apoyo</p>
            <h2 className="text-3xl font-bold">Apoya el Ministerio</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Tu generosidad hace posible que el fuego del evangelio siga llegando a más personas.
            </p>
          </div>
          <PublicDonationSection />
        </div>
      </section>

      <section className="py-16 border-t">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Sientes el llamado?</h2>
          <p className="text-muted-foreground mb-6">
            Unete como miembro, maestro o iglesia aliada. Juntos llevamos el fuego del evangelio a las naciones.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/registro">
              <Button size="lg" data-testid="button-cta-join">
                Ser Parte del Equipo
              </Button>
            </Link>
            <Link href="/ficha-ministerial">
              <Button size="lg" variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                Directorio de Maestros
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
