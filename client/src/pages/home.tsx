import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Flame, Radio, Users, BookOpen, Heart, Globe } from "lucide-react";

const stats = [
  { label: "Anos de Servicio", value: "7+" },
  { label: "Paises", value: "3" },
  { label: "Vidas Impactadas", value: "1000+" },
  { label: "Fuego del Espiritu", value: "\u221E" },
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
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 fire-gradient opacity-10 dark:opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-subtitle">
            Desde 2017 - Ciudad Bolivar, Venezuela
          </p>
          <p className="text-xs text-muted-foreground/50 mb-2">v2.1.0 — Febrero 2026</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="text-title">
            <span className="fire-text">AVIVANDO EL FUEGO</span>
          </h1>
          <blockquote className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-2 italic">
            "Para que vuestra fe no este fundada en la sabiduria de los hombres, sino en el poder de Dios"
          </blockquote>
          <p className="text-sm text-muted-foreground mb-8">- 1 Corintios 2:4</p>
          <div className="flex flex-wrap justify-center gap-3">
            {user ? (
              <Link href="/perfil">
                <Button size="lg" data-testid="button-hero-profile">
                  <Flame className="w-4 h-4 mr-2" />
                  Mi Perfil
                </Button>
              </Link>
            ) : (
              <Link href="/registro">
                <Button size="lg" data-testid="button-hero-join">
                  <Flame className="w-4 h-4 mr-2" />
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
        </div>
      </section>

      <section className="py-12 border-t">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center" data-testid={`stat-${s.value}`}>
              <p className="text-3xl md:text-4xl font-bold fire-text">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-card border-t">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-primary font-medium mb-2">Nuestro Trabajo</p>
            <h2 className="text-3xl font-bold">Areas de Accion</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Multiples frentes de batalla espiritual, un solo objetivo: llevar el fuego del evangelio a toda criatura.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((a) => (
              <Card key={a.title} className="p-6" data-testid={`card-area-${a.title}`}>
                <a.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Sientes el llamado?</h2>
          <p className="text-muted-foreground mb-6">
            Estamos buscando obreros apasionados que quieran unirse a esta vision de llevar el fuego del evangelio a las naciones.
          </p>
          <Link href="/registro">
            <Button size="lg" data-testid="button-cta-join">
              Ser Parte del Equipo
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
