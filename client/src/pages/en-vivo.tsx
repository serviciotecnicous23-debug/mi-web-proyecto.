import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLiveStreamConfig } from "@/hooks/use-users";
import {
  Radio, Mic, Calendar, Video, Volume2, VolumeX,
  Play, Pause, Tv, Signal, Music, ExternalLink,
} from "lucide-react";
import { SiYoutube, SiFacebook, SiTiktok } from "react-icons/si";

const schedule = [
  { day: "Lunes - Viernes", time: "12:00 PM", program: "Fuego al Mediodia", type: "Ensenanza Biblica" },
  { day: "Sabado", time: "7:00 PM", program: "Noche de Avivamiento", type: "Culto en Vivo" },
  { day: "Domingo", time: "10:00 AM", program: "Culto Dominical", type: "Servicio Principal" },
  { day: "Miercoles", time: "8:00 PM", program: "Estudio Biblico", type: "Ensenanza" },
];

function extractYouTubeId(url: string): string | null {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/(?:channel|c)\/[^/]+\/live/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m && m[1]) return m[1];
    }
    if (url.match(/youtube\.com/) && url.match(/live/)) {
      const parsed = new URL(url);
      const v = parsed.searchParams.get("v");
      if (v) return v;
    }
  } catch {
    return null;
  }
  return null;
}

function extractFacebookVideoUrl(url: string): string {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560&height=315`;
}

function getSourceIcon(type: string) {
  switch (type) {
    case "youtube": return <SiYoutube className="w-5 h-5 text-red-500" />;
    case "facebook": return <SiFacebook className="w-5 h-5 text-blue-600" />;
    case "tiktok": return <SiTiktok className="w-5 h-5" />;
    case "radio": return <Radio className="w-5 h-5 text-primary" />;
    default: return <Tv className="w-5 h-5 text-primary" />;
  }
}

function getSourceLabel(type: string) {
  switch (type) {
    case "youtube": return "YouTube";
    case "facebook": return "Facebook";
    case "tiktok": return "TikTok";
    case "radio": return "Radio";
    case "custom": return "Transmision Externa";
    default: return "En Vivo";
  }
}

function PulsingDot({ color = "bg-red-500" }: { color?: string }) {
  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`} />
    </span>
  );
}

function AudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-8" aria-hidden>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full bg-primary/80 transition-all duration-300 ${isPlaying ? "animate-pulse" : ""}`}
          style={{
            height: isPlaying ? `${Math.random() * 100}%` : "15%",
            animationDelay: `${i * 0.08}s`,
            animationDuration: `${0.4 + Math.random() * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

function RadioPlayer({ url, title }: { url: string; title?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current || !url) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setError(false);
      audioRef.current.src = url;
      audioRef.current.play().catch(() => setError(true));
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        onError={() => { setError(true); setIsPlaying(false); }}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-md p-6 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
          {isPlaying ? (
            <AudioVisualizer isPlaying={isPlaying} />
          ) : (
            <Radio className="w-10 h-10 text-primary" />
          )}
        </div>

        <div className="text-center">
          <p className="font-bold text-lg">{title || "Radio Avivando el Fuego"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isPlaying ? "Reproduciendo..." : url ? "Listo para reproducir" : "Sin senal configurada"}
          </p>
        </div>

        {error && (
          <p className="text-xs text-destructive">No se pudo conectar con la emisora. Verifica la URL de la senal.</p>
        )}

        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant={isPlaying ? "default" : "outline"}
            onClick={togglePlay}
            disabled={!url}
            data-testid="button-radio-play"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            data-testid="button-radio-mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
            className="w-24 accent-primary"
            data-testid="slider-radio-volume"
          />
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ sourceType, sourceUrl }: { sourceType: string; sourceUrl: string }) {
  if (sourceType === "youtube") {
    const videoId = extractYouTubeId(sourceUrl);
    if (!videoId) return <p className="text-center text-sm text-muted-foreground p-8">URL de YouTube no valida</p>;
    return (
      <div className="aspect-video w-full rounded-md overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="YouTube Live"
          data-testid="iframe-youtube-player"
        />
      </div>
    );
  }

  if (sourceType === "facebook") {
    return (
      <div className="aspect-video w-full rounded-md overflow-hidden bg-black">
        <iframe
          src={extractFacebookVideoUrl(sourceUrl)}
          className="w-full h-full"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          title="Facebook Live"
          data-testid="iframe-facebook-player"
          style={{ border: "none" }}
        />
      </div>
    );
  }

  if (sourceType === "tiktok") {
    return (
      <div className="aspect-video w-full rounded-md overflow-hidden bg-black flex flex-col items-center justify-center gap-4 p-6">
        <SiTiktok className="w-16 h-16 text-white" />
        <p className="text-white text-center font-medium">Transmision en TikTok Live</p>
        <p className="text-white/60 text-sm text-center">TikTok no permite embeber transmisiones directamente. Haz clic para verla en la aplicacion.</p>
        <Button
          variant="outline"
          className="border-white/30 text-white"
          onClick={() => window.open(sourceUrl, "_blank")}
          data-testid="button-tiktok-open"
        >
          <ExternalLink className="w-4 h-4 mr-2" /> Abrir en TikTok
        </Button>
      </div>
    );
  }

  if (sourceType === "custom") {
    return (
      <div className="aspect-video w-full rounded-md overflow-hidden bg-black">
        <iframe
          src={sourceUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="Transmision en Vivo"
          data-testid="iframe-custom-player"
        />
      </div>
    );
  }

  return null;
}

export default function EnVivo() {
  const { data: config, isLoading, isError } = useLiveStreamConfig();

  const isLive = config?.isLive && config?.sourceType !== "radio" && config?.sourceUrl;
  const showRadio = !isLive || config?.sourceType === "radio";
  const activeSource = isLive ? config.sourceType : "radio";

  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              {isLive ? <PulsingDot /> : <Signal className="w-5 h-5 text-muted-foreground" />}
              <Badge variant={isLive ? "destructive" : "secondary"} data-testid="badge-live-status">
                {isLive ? "EN VIVO" : "RADIO 24/7"}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-live-title">
              {isLive && config?.title ? config.title : "Radio y Transmisiones"}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isLive
                ? "Estamos transmitiendo en vivo. Conectate ahora y se parte de este momento especial."
                : "Conectate con nosotros desde cualquier lugar del mundo. Escucha nuestra radio y unete a nuestras reuniones en vivo."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card data-testid="card-main-player">
                <CardContent className="p-4 md:p-6">
                  {isLoading ? (
                    <div className="aspect-video flex items-center justify-center bg-muted rounded-md">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Signal className="w-8 h-8 animate-pulse" />
                        <p className="text-sm">Conectando...</p>
                      </div>
                    </div>
                  ) : isError ? (
                    <div className="aspect-video flex items-center justify-center bg-muted rounded-md">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Radio className="w-10 h-10 text-primary" />
                        <p className="font-bold text-lg">Radio Avivando el Fuego</p>
                        <p className="text-sm text-center max-w-xs">La senal esta disponible. Vuelve pronto para escuchar nuestra programacion en vivo.</p>
                      </div>
                    </div>
                  ) : isLive ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PulsingDot />
                        {getSourceIcon(activeSource)}
                        <span className="text-sm font-medium">Transmitiendo por {getSourceLabel(activeSource)}</span>
                      </div>
                      <VideoPlayer sourceType={config.sourceType} sourceUrl={config.sourceUrl} />
                    </div>
                  ) : (
                    <RadioPlayer
                      url={config?.radioUrl || ""}
                      title={config?.title || "Radio Avivando el Fuego"}
                    />
                  )}
                </CardContent>
              </Card>

              {isLive && config?.radioUrl && (
                <Card data-testid="card-radio-fallback">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Radio className="w-5 h-5 text-primary" />
                      <span className="font-medium text-sm">Radio Avivando el Fuego</span>
                      <Badge variant="secondary" className="ml-auto">Radio</Badge>
                    </div>
                    <RadioPlayer url={config.radioUrl} title="Radio Avivando el Fuego" />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card data-testid="card-current-source">
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Signal className="w-4 h-4 text-primary" />
                    Estado de la Senal
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {isLive ? <PulsingDot /> : <div className="w-3 h-3 rounded-full bg-green-500" />}
                      <span className="text-sm font-medium">{isLive ? "Transmision en vivo" : "Radio activa"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getSourceIcon(activeSource)}
                      <span>Fuente: {getSourceLabel(activeSource)}</span>
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-medium mb-2 text-muted-foreground">Plataformas compatibles</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Radio className="w-3 h-3" /> Radio
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <SiYoutube className="w-3 h-3" /> YouTube
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <SiFacebook className="w-3 h-3" /> Facebook
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <SiTiktok className="w-3 h-3" /> TikTok
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-schedule">
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Programacion Semanal
                  </h3>
                  <div className="space-y-2">
                    {schedule.map((item) => (
                      <div
                        key={item.program}
                        className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md"
                        data-testid={`schedule-${item.program.replace(/\s/g, "-").toLowerCase()}`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{item.program}</p>
                          <p className="text-[10px] text-muted-foreground">{item.type}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-medium">{item.time}</p>
                          <p className="text-[10px] text-muted-foreground">{item.day}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-connect-info">
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" />
                    Como Conectarte
                  </h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Radio className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                      <p><span className="font-medium text-foreground">Radio 24/7:</span> Musica cristiana, predicaciones y ensenanzas las 24 horas.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Video className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                      <p><span className="font-medium text-foreground">En Vivo:</span> Cultos, reuniones y eventos transmitidos en tiempo real.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mic className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                      <p><span className="font-medium text-foreground">Interactivo:</span> Participa con nosotros desde cualquier lugar del mundo.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
