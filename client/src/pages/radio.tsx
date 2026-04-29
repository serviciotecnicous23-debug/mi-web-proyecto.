import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Clock3,
  Flame,
  FolderOpen,
  Headphones,
  Megaphone,
  Mic2,
  Music2,
  Radio,
  Satellite,
  ShieldCheck,
  Signal,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { RadioStationPlayer } from "@/components/RadioStationPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRadioStation } from "@/hooks/use-radio";

const billboardItems = [
  {
    icon: Radio,
    title: "Senal oficial",
    text: "La transmision principal sale desde el servidor propio AzuraCast y se escucha aqui en la pagina del ministerio.",
  },
  {
    icon: Megaphone,
    title: "Cartelera ministerial",
    text: "La radio usa una programacion nueva separada del archivo inicial, lista para avisos, campanas, vigilias y cultos.",
  },
  {
    icon: Headphones,
    title: "Audio continuo",
    text: "Al presionar reproducir, el telefono o navegador maneja el audio como una emisora en vivo.",
  },
];

const activeBlocks = [
  {
    title: "Nueva adoracion y ministracion",
    description: "Canciones actuales de adoracion, ministracion y busqueda de la presencia de Dios.",
    count: "29 audios",
    status: "Activo",
  },
  {
    title: "Nueva alabanza y gozo",
    description: "Cantos de celebracion, gozo y apertura para levantar la fe.",
    count: "6 audios",
    status: "Activo",
  },
  {
    title: "Predicas nuevas",
    description: "Predicas recientes integradas como bloque de ensenanza en la rotacion.",
    count: "10 audios",
    status: "Cada hora",
  },
  {
    title: "Audios del ministerio y especiales",
    description: "Audios propios, material pastoral y contenido para revision ministerial.",
    count: "33 audios",
    status: "Activo",
  },
];

const archiveSummary = "68 audios del paquete inicial quedan preservados como archivo inactivo.";

function formatTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

type AzuraSong = {
  text?: string;
  artist?: string;
  title?: string;
};

type LiveSnapshot = {
  isOnline: boolean;
  listeners: number;
  playlist: string;
  song: string;
  nextPlaylist: string;
  nextSong: string;
};

function getSongText(song?: AzuraSong) {
  if (!song) return "";
  return song.text || [song.artist, song.title].filter(Boolean).join(" - ") || song.title || "";
}

function getLiveSnapshot(data: unknown): LiveSnapshot | null {
  const payload = Array.isArray(data) ? data[0] : data;
  if (!payload || typeof payload !== "object") return null;

  const record = payload as any;
  return {
    isOnline: Boolean(record.is_online),
    listeners: Number(record.listeners?.current ?? record.listeners?.total ?? 0),
    playlist: String(record.now_playing?.playlist || ""),
    song: getSongText(record.now_playing?.song),
    nextPlaylist: String(record.playing_next?.playlist || ""),
    nextSong: getSongText(record.playing_next?.song),
  };
}

export default function RadioPage() {
  const { data: station, isLoading, isError } = useRadioStation();
  const libraryTracks = station?.library.tracks ?? [];
  const provider = station?.provider;
  const stationUrl = provider?.stationUrl || "https://40.160.2.176.sslip.io/public/avivando_el_fuego";
  const isAzuraCastPrimary = provider?.isPrimary ?? false;
  const lastSync = station?.updatedAt ? formatTime(station.updatedAt) : "";
  const [liveSnapshot, setLiveSnapshot] = useState<LiveSnapshot | null>(null);
  const streamHost = useMemo(() => {
    if (!station?.streamUrl) return "AzuraCast";
    try {
      return new URL(station.streamUrl).host;
    } catch {
      return "AzuraCast";
    }
  }, [station?.streamUrl]);

  useEffect(() => {
    if (!station?.metadataUrl) return;

    let cancelled = false;
    const loadLiveSnapshot = async () => {
      try {
        const response = await fetch(station.metadataUrl, { cache: "no-store" });
        if (!response.ok) return;
        const snapshot = getLiveSnapshot(await response.json());
        if (!cancelled) setLiveSnapshot(snapshot);
      } catch {
        if (!cancelled) setLiveSnapshot(null);
      }
    };

    loadLiveSnapshot();
    const timer = window.setInterval(loadLiveSnapshot, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [station?.metadataUrl]);

  return (
    <Layout>
      <section className="relative overflow-hidden border-b py-10 md:py-14">
        <div className="hero-grid-bg absolute inset-0 opacity-70" aria-hidden />
        <div className="absolute inset-x-0 top-0 h-1 fire-gradient" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="grid gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Radio className="h-3 w-3" />
                  Radio online
                </Badge>
                <Badge variant={isAzuraCastPrimary ? "default" : "secondary"} className="gap-1">
                  <Satellite className="h-3 w-3" />
                  {isAzuraCastPrimary ? "AzuraCast activo" : "Senal configurada"}
                </Badge>
              </div>

              <h1 className="heading-display max-w-3xl text-5xl leading-none md:text-7xl">
                Avivando el Fuego Radio
              </h1>
              <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
                Adoracion, alabanza, Palabra y predicacion en una emisora cristiana 24/7 conectada al ministerio.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <a href="#radio-player">
                    <Headphones className="h-4 w-4" />
                    Escuchar ahora
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={stationUrl} target="_blank" rel="noreferrer">
                    <ArrowUpRight className="h-4 w-4" />
                    Abrir emisora
                  </a>
                </Button>
              </div>
            </div>

            <Card className="bg-card/85 backdrop-blur">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Signal className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Estado de la emisora</span>
                  </div>
                  <Badge variant={station?.isConfigured ? "default" : "secondary"}>
                    {station?.isConfigured ? "Operativa" : "Configurando"}
                  </Badge>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-44" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">Transmitiendo desde AzuraCast</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        La senal, Icecast y AutoDJ funcionan 24/7 desde el VPS del ministerio.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md border bg-background/60 p-3">
                        <p className="text-xs text-muted-foreground">Audio activo</p>
                        <p className="mt-1 font-bold">MP3 en vivo</p>
                      </div>
                      <div className="rounded-md border bg-background/60 p-3">
                        <p className="text-xs text-muted-foreground">Biblioteca activa</p>
                        <p className="mt-1 font-bold">79 audios nuevos</p>
                      </div>
                      <div className="rounded-md border bg-background/60 p-3">
                        <p className="text-xs text-muted-foreground">Actualizado</p>
                        <p className="mt-1 font-bold">{lastSync || "Ahora"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div id="radio-player" className="mt-8 scroll-mt-24">
            {isLoading ? (
              <Skeleton className="h-44 w-full rounded-lg" />
            ) : isError || !station ? (
              <Card>
                <CardContent className="flex items-center gap-3 p-6">
                  <Signal className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-muted-foreground">No se pudo cargar la configuracion de la radio.</p>
                </CardContent>
              </Card>
            ) : (
              <RadioStationPlayer
                streamUrl={station.streamUrl}
                title={station.name}
                subtitle={station.slogan}
                isConfigured={station.isConfigured}
                metadataUrl={station.metadataUrl}
                playlist={station.streamUrl.startsWith("/uploads/radio/") ? libraryTracks : []}
              />
            )}
          </div>
        </div>
      </section>

      <section className="border-b bg-card/30 py-8">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Ahora en vivo</p>
                <Badge variant={liveSnapshot?.isOnline ? "default" : "secondary"}>
                  {liveSnapshot?.isOnline ? "Online" : "Sin datos"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{liveSnapshot?.playlist || "AzuraCast AutoDJ"}</p>
              <p className="mt-1 line-clamp-2 font-bold">{liveSnapshot?.song || "Cargando informacion del servidor..."}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="mb-2 text-sm font-semibold">Siguiente bloque</p>
              <p className="text-sm text-muted-foreground">{liveSnapshot?.nextPlaylist || "Rotacion automatica"}</p>
              <p className="mt-1 line-clamp-2 font-bold">{liveSnapshot?.nextSong || "AzuraCast selecciona el proximo audio"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="mb-2 text-sm font-semibold">Servidor</p>
              <p className="text-sm text-muted-foreground">{streamHost}</p>
              <p className="mt-1 font-bold">{liveSnapshot?.listeners ?? 0} oyentes conectados</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Cartelera de la Radio
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {billboardItems.map((item) => (
                  <div key={item.title} className="flex gap-3 rounded-md border bg-background/60 p-4">
                    <item.icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Enlace Oficial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  La pagina reproduce el stream directo de AzuraCast. El enlace publico queda disponible para compartirlo con la congregacion.
                </p>
                <div className="rounded-md border bg-background/60 p-3 text-sm">
                  <p className="font-medium">{provider?.name || "AzuraCast"}</p>
                  <p className="mt-1 break-all text-muted-foreground">{stationUrl}</p>
                </div>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <a href={stationUrl} target="_blank" rel="noreferrer">
                    <ArrowUpRight className="h-4 w-4" />
                    Visitar estacion
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  Programacion Activa
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {activeBlocks.map((block) => (
                  <div key={block.title} className="rounded-md border bg-background/60 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-bold">{block.title}</h3>
                      <Badge variant="outline">{block.count}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{block.description}</p>
                    <p className="mt-3 text-xs font-medium text-primary">{block.status}</p>
                  </div>
                ))}
                <div className="rounded-md border bg-background/60 p-4 sm:col-span-2">
                  <h3 className="font-bold">Archivo base anterior</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{archiveSummary}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-primary" />
                  Operacion del AutoDJ
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-md border bg-background/60 p-4">
                  <h3 className="font-bold">AutoDJ propio</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Liquidsoap e Icecast manejan la lista activa desde el servidor. Esta pagina muestra ahora la playlist y la proxima pista que informa AzuraCast.
                  </p>
                </div>
                <div className="rounded-md border bg-background/60 p-4">
                  <h3 className="font-bold">Nuevo material separado</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Lo nuevo se programa aparte del paquete inicial. Los audios anteriores quedan guardados, pero no entran en la rotacion principal.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t bg-card/40 py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <Flame className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold">Avivamiento 24/7</h3>
              <p className="mt-1 text-sm text-muted-foreground">Una senal viva para acompanamiento espiritual y evangelismo digital.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Music2 className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold">Contenido vocal</h3>
              <p className="mt-1 text-sm text-muted-foreground">Adoracion, coros, Palabra y mensajes, sin depender de una parrilla ficticia.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mic2 className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold">Lista para crecer</h3>
              <p className="mt-1 text-sm text-muted-foreground">La cartelera puede recibir anuncios, campanas y predicas nuevas del ministerio.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
