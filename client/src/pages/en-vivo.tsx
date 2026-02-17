import { useState, useRef, useEffect, useCallback } from "react";
import Hls from "hls.js";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLiveStreamConfig } from "@/hooks/use-users";
import {
  Radio, Mic, Calendar, Video, Volume2, VolumeX,
  Play, Pause, Tv, Signal, Music, ExternalLink, AlertTriangle, Cast,
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
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m && m[1]) return m[1];
    }
    if (url.match(/youtube\.com/)) {
      const parsed = new URL(url);
      const v = parsed.searchParams.get("v");
      if (v) return v;
    }
  } catch {
    return null;
  }
  return null;
}

function extractYouTubeChannelId(url: string): string | null {
  try {
    const m = url.match(/youtube\.com\/(?:channel|c)\/([^/\?]+)/);
    if (m && m[1]) return m[1];
  } catch {
    return null;
  }
  return null;
}

// Build the best YouTube embed URL from any YouTube link
function buildYouTubeEmbedUrl(sourceUrl: string): { videoId: string | null; channelId: string | null; embedUrl: string; watchUrl: string } | null {
  // Try video ID first
  const videoId = extractYouTubeId(sourceUrl);
  if (videoId) {
    return {
      videoId,
      channelId: null,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }
  // Try channel live stream
  const channelId = extractYouTubeChannelId(sourceUrl);
  if (channelId) {
    return {
      videoId: null,
      channelId,
      embedUrl: `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&enablejsapi=1&origin=${window.location.origin}`,
      watchUrl: sourceUrl,
    };
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
    case "restream": return <Cast className="w-5 h-5 text-green-500" />;
    case "hls": return <Signal className="w-5 h-5 text-purple-500" />;
    case "radio": return <Radio className="w-5 h-5 text-primary" />;
    default: return <Tv className="w-5 h-5 text-primary" />;
  }
}

function getSourceLabel(type: string) {
  switch (type) {
    case "youtube": return "YouTube";
    case "facebook": return "Facebook";
    case "tiktok": return "TikTok";
    case "restream": return "Restream";
    case "hls": return "Stream Directo";
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

function YouTubePlayer({ sourceUrl }: { sourceUrl: string }) {
  const [embedError, setEmbedError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const ytData = buildYouTubeEmbedUrl(sourceUrl);

  if (!ytData) {
    return (
      <div className="aspect-video w-full rounded-md overflow-hidden bg-black flex flex-col items-center justify-center gap-4 p-6">
        <AlertTriangle className="w-12 h-12 text-yellow-400" />
        <p className="text-white text-center font-medium">URL de YouTube no válida</p>
        <Button variant="outline" className="border-white/30 text-white" onClick={() => window.open(sourceUrl, "_blank")}>
          <ExternalLink className="w-4 h-4 mr-2" /> Abrir enlace original
        </Button>
      </div>
    );
  }

  // Load YouTube IFrame API and create player with proper error handling
  useEffect(() => {
    setEmbedError(false);
    setIsLoading(true);

    // Unique div id for this player instance
    const playerId = "yt-player-" + Date.now();
    if (playerContainerRef.current) {
      playerContainerRef.current.innerHTML = `<div id="${playerId}" style="width:100%;height:100%"></div>`;
    }

    // Destroy previous player
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }

    const createPlayer = () => {
      if (!(window as any).YT?.Player) return;

      const playerConfig: any = {
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            setIsLoading(false);
          },
          onError: (event: any) => {
            // Error codes: 2=invalid param, 5=HTML5 error, 100=not found, 101/150/153=embed restricted
            const code = event?.data;
            console.warn("YouTube Player Error:", code);
            if (code === 150 || code === 153 || code === 101 || code === 100) {
              setEmbedError(true);
              setIsLoading(false);
            } else if (code === 5) {
              // HTML5 player error - try reopening
              setEmbedError(true);
              setIsLoading(false);
            } else {
              setEmbedError(true);
              setIsLoading(false);
            }
          },
          onStateChange: (event: any) => {
            // -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
            if (event?.data === 1 || event?.data === 3) {
              setIsLoading(false);
              setEmbedError(false);
            }
          },
        },
      };

      // Use videoId or channel live_stream
      if (ytData.videoId) {
        playerConfig.videoId = ytData.videoId;
      } else if (ytData.channelId) {
        playerConfig.playerVars.channel = ytData.channelId;
        playerConfig.videoId = undefined;
        // For channel live streams, use the embed URL approach
        playerConfig.playerVars.listType = undefined;
      }

      try {
        playerRef.current = new (window as any).YT.Player(playerId, playerConfig);
      } catch (err) {
        console.error("Failed to create YT player:", err);
        setEmbedError(true);
        setIsLoading(false);
      }
    };

    // Load the YouTube IFrame API script if not already loaded
    if ((window as any).YT?.Player) {
      createPlayer();
    } else {
      // Set callback
      const prevCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        createPlayer();
      };

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      } else {
        // Script already exists but API not ready yet — poll
        const interval = setInterval(() => {
          if ((window as any).YT?.Player) {
            clearInterval(interval);
            createPlayer();
          }
        }, 200);
        setTimeout(() => clearInterval(interval), 10000);
      }
    }

    // Fallback timeout: if nothing happens after 8 seconds, show error
    const fallbackTimer = setTimeout(() => {
      if (isLoading && !embedError) {
        // Check if player actually started playing
        try {
          const state = playerRef.current?.getPlayerState?.();
          if (state === undefined || state === -1 || state === null) {
            setEmbedError(true);
            setIsLoading(false);
          }
        } catch {
          // If we can't read state, probably an error
          setEmbedError(true);
          setIsLoading(false);
        }
      }
    }, 10000);

    return () => {
      clearTimeout(fallbackTimer);
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [sourceUrl]);

  if (embedError) {
    return (
      <div className="aspect-video w-full rounded-md overflow-hidden bg-gradient-to-br from-red-950 to-black flex flex-col items-center justify-center gap-4 p-6">
        <SiYoutube className="w-16 h-16 text-red-500" />
        <p className="text-white text-center font-medium text-lg">Este video no permite reproducirse aqui</p>
        <p className="text-white/60 text-sm text-center max-w-sm">
          El creador del video ha restringido su reproduccion fuera de YouTube (Error de embed). 
          Puedes verlo directamente en YouTube haciendo clic abajo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button
            variant="default"
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
            onClick={() => window.open(ytData.watchUrl, "_blank")}
          >
            <SiYoutube className="w-5 h-5" /> Ver en YouTube
          </Button>
          <Button
            variant="outline"
            className="border-white/30 text-white/80 hover:text-white gap-2"
            onClick={() => {
              // Copy link to clipboard
              navigator.clipboard?.writeText(ytData.watchUrl);
            }}
          >
            <ExternalLink className="w-4 h-4" /> Copiar enlace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-md overflow-hidden bg-black relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <SiYoutube className="w-12 h-12 text-red-500 animate-pulse" />
            <p className="text-white/70 text-sm">Cargando video...</p>
          </div>
        </div>
      )}
      <div ref={playerContainerRef} className="w-full h-full" />
      {/* Fallback button always visible */}
      <div className="absolute bottom-2 right-2 z-10">
        <Button
          size="sm"
          variant="secondary"
          className="opacity-70 hover:opacity-100 text-xs gap-1"
          onClick={() => window.open(ytData.watchUrl, "_blank")}
        >
          <ExternalLink className="w-3 h-3" /> YouTube
        </Button>
      </div>
    </div>
  );
}

function HlsPlayer({ sourceUrl }: { sourceUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;

    setError(false);
    setLoading(true);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(true);
          setLoading(false);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls.startLoad(), 3000);
          } else {
            hls.destroy();
          }
        }
      });
      return () => { hls.destroy(); hlsRef.current = null; };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = sourceUrl;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => { setError(true); setLoading(false); });
    } else {
      setError(true);
      setLoading(false);
    }
  }, [sourceUrl]);

  if (error) {
    return (
      <div className="aspect-video w-full rounded-md overflow-hidden bg-gradient-to-br from-purple-950 to-black flex flex-col items-center justify-center gap-4 p-6">
        <Signal className="w-16 h-16 text-purple-400" />
        <p className="text-white text-center font-medium">No se pudo conectar con el stream</p>
        <p className="text-white/60 text-sm text-center max-w-sm">
          Verifica que la URL del stream HLS sea correcta y que el servidor este transmitiendo.
        </p>
        <Button
          variant="outline"
          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          onClick={() => { setError(false); setLoading(true); hlsRef.current?.startLoad(); }}
        >
          Reintentar conexion
        </Button>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-md overflow-hidden bg-black relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="flex flex-col items-center gap-2 text-white">
            <Signal className="w-8 h-8 animate-pulse text-purple-400" />
            <p className="text-sm">Conectando al stream...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay
        playsInline
        data-testid="video-hls-player"
      />
    </div>
  );
}

function RestreamPlayer({ sourceUrl }: { sourceUrl: string }) {
  // Restream.io provides embeddable players via iframe
  // Example URL: https://player.restream.io/player/xxxxxxxx
  // Or custom Restream embed URLs
  const embedUrl = sourceUrl.includes("?") ? sourceUrl : `${sourceUrl}?autoplay=true`;

  return (
    <div className="aspect-video w-full rounded-md overflow-hidden bg-black relative">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title="Restream - Transmision en Vivo"
        data-testid="iframe-restream-player"
        style={{ border: "none" }}
      />
      <div className="absolute bottom-2 right-2 z-10">
        <Button
          size="sm"
          variant="secondary"
          className="opacity-70 hover:opacity-100 text-xs gap-1"
          onClick={() => window.open(sourceUrl, "_blank")}
        >
          <ExternalLink className="w-3 h-3" /> Abrir Player
        </Button>
      </div>
    </div>
  );
}

function VideoPlayer({ sourceType, sourceUrl }: { sourceType: string; sourceUrl: string }) {
  if (sourceType === "youtube") {
    return <YouTubePlayer sourceUrl={sourceUrl} />;
  }

  if (sourceType === "restream") {
    return <RestreamPlayer sourceUrl={sourceUrl} />;
  }

  if (sourceType === "hls") {
    return <HlsPlayer sourceUrl={sourceUrl} />;
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
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Cast className="w-3 h-3" /> Restream
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Signal className="w-3 h-3" /> HLS
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
