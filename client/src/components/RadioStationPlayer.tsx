import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  AlertTriangle,
  ExternalLink,
  Pause,
  Play,
  Radio,
  RotateCw,
  SkipForward,
  Signal,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RadioLibraryTrack } from "@shared/radio";

type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "error";

type RadioStationPlayerProps = {
  streamUrl: string;
  title: string;
  subtitle: string;
  isConfigured: boolean;
  metadataUrl?: string;
  playlist?: RadioLibraryTrack[];
  variant?: "default" | "scene";
};

function isHlsUrl(url: string) {
  return /\.m3u8($|\?)/i.test(url) || /\/hls\//i.test(url);
}

function getNowPlayingText(data: unknown) {
  const payload = Array.isArray(data) ? data[0] : data;
  if (!payload || typeof payload !== "object") return "";

  const record = payload as Record<string, any>;
  const song = record.now_playing?.song;
  const artist = typeof song?.artist === "string" ? song.artist : "";
  const title = typeof song?.title === "string" ? song.title : "";
  const text = typeof song?.text === "string" ? song.text : "";
  const icecastTitle = record.icestats?.source?.title;
  const fallbackTitle = record.title;

  return text || [artist, title].filter(Boolean).join(" - ") || icecastTitle || fallbackTitle || "";
}

function Visualizer({ active }: { active: boolean }) {
  return (
    <div className="flex h-10 items-end gap-1" aria-hidden>
      {Array.from({ length: 16 }).map((_, index) => (
        <span
          key={index}
          className={`w-1 rounded-full bg-primary ${active ? "animate-radio-bar" : ""}`}
          style={{
            height: active ? `${28 + ((index * 17) % 58)}%` : "18%",
            animationDelay: `${index * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function RadioStationPlayer({
  streamUrl,
  title,
  subtitle,
  isConfigured,
  metadataUrl,
  playlist = [],
  variant = "default",
}: RadioStationPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const autoPlayNextRef = useRef(false);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [volume, setVolume] = useState(82);
  const [muted, setMuted] = useState(false);
  const [metadata, setMetadata] = useState("");
  const [trackIndex, setTrackIndex] = useState(0);
  const playlistTrack = playlist[trackIndex];
  const currentSource = playlistTrack?.url || streamUrl;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = muted ? 0 : volume / 100;
  }, [volume, muted]);

  useEffect(() => {
    const shouldAutoplay = autoPlayNextRef.current;
    autoPlayNextRef.current = false;
    setStatus("idle");
    setMetadata("");
    hlsRef.current?.destroy();
    hlsRef.current = null;

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    if (shouldAutoplay) {
      window.setTimeout(() => void play(), 0);
    }
  }, [currentSource]);

  useEffect(() => {
    setTrackIndex(0);
  }, [streamUrl, playlist.length]);

  useEffect(() => {
    if (!metadataUrl) return;

    let cancelled = false;
    const loadMetadata = async () => {
      try {
        const res = await fetch(metadataUrl, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const nowPlaying = getNowPlayingText(data);
        if (!cancelled) setMetadata(String(nowPlaying).slice(0, 120));
      } catch {
        if (!cancelled) setMetadata("");
      }
    };

    loadMetadata();
    const timer = window.setInterval(loadMetadata, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [metadataUrl]);

  const prepareSource = (source = currentSource) => {
    const audio = audioRef.current;
    if (!audio || !source) return false;

    hlsRef.current?.destroy();
    hlsRef.current = null;

    if (isHlsUrl(source) && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 12,
      });
      hlsRef.current = hls;
      hls.loadSource(source);
      hls.attachMedia(audio);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setStatus("error");
      });
      return true;
    }

    audio.src = source;
    return true;
  };

  const play = async () => {
    const audio = audioRef.current;
    if (!audio || !currentSource) return;

    setStatus("loading");
    try {
      if (!audio.src && !prepareSource()) return;
      await audio.play();
      setStatus("playing");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata || playlistTrack?.title || title,
        artist: "Ministerio Avivando el Fuego",
        album: "Avivando el Fuego Radio",
        artwork: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
      navigator.mediaSession.playbackState = status === "playing" ? "playing" : status === "paused" ? "paused" : "none";
      navigator.mediaSession.setActionHandler("play", () => void play());
      navigator.mediaSession.setActionHandler("pause", () => {
        audioRef.current?.pause();
        setStatus("paused");
      });
      navigator.mediaSession.setActionHandler("stop", () => {
        audioRef.current?.pause();
        setStatus("paused");
      });
    } catch {
      // Media Session support varies by browser; playback still works without it.
    }
  }, [metadata, playlistTrack?.title, status, title]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (status === "playing" || status === "loading") {
      audio.pause();
      setStatus("paused");
      return;
    }

    void play();
  };

  const retry = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    void play();
  };

  const playNext = async () => {
    if (playlist.length <= 1) return;
    const nextIndex = (trackIndex + 1) % playlist.length;
    autoPlayNextRef.current = status === "playing" || status === "loading";
    setTrackIndex(nextIndex);
    setMetadata("");
  };

  const handleEnded = async () => {
    if (playlist.length > 1) {
      await playNext();
      return;
    }

    if (playlist.length === 1) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      try {
        await audio.play();
        setStatus("playing");
      } catch {
        setStatus("error");
      }
    }
  };

  const isPlaying = status === "playing" || status === "loading";
  const statusLabel = isConfigured ? (playlist.length ? "BIBLIOTECA ACTIVA" : "SENAL OFICIAL") : "MODO PRUEBA";
  const isScene = variant === "scene";

  return (
    <div
      className={
        isScene
          ? "overflow-hidden rounded-[2rem] border border-orange-400/25 bg-black/45 shadow-[0_36px_120px_rgba(0,0,0,0.48),0_0_70px_rgba(249,115,22,0.16)] backdrop-blur"
          : "overflow-hidden rounded-lg border bg-card shadow-xl"
      }
    >
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        playsInline
        preload="none"
        onPlaying={() => setStatus("playing")}
        onWaiting={() => setStatus("loading")}
        onPause={() => setStatus((current) => (current === "error" ? "error" : "paused"))}
        onEnded={() => void handleEnded()}
        onError={() => setStatus("error")}
      />

      <div className={isScene ? "bg-gradient-to-br from-orange-300 via-orange-600 to-red-700 p-[1px]" : "fire-gradient p-[1px]"}>
        <div className={isScene ? "bg-[#090608]/92 px-5 py-6 md:px-8 md:py-8" : "bg-card px-5 py-5 md:px-7 md:py-6"}>
          <div className={isScene ? "flex flex-col gap-7 2xl:flex-row 2xl:items-center 2xl:justify-between" : "flex flex-col gap-6 md:flex-row md:items-center md:justify-between"}>
            <div className="flex items-center gap-4">
              <div
                className={
                  isScene
                    ? "flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-orange-300/25 bg-white/5 shadow-[0_0_42px_rgba(249,115,22,0.24)]"
                    : "flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border bg-background"
                }
              >
                {isPlaying ? <Visualizer active={isPlaying} /> : <Radio className="h-9 w-9 text-primary" />}
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant={isConfigured ? "default" : "secondary"} className="gap-1">
                    <Signal className="h-3 w-3" />
                    {statusLabel}
                  </Badge>
                  {status === "error" && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      SIN CONEXION
                    </Badge>
                  )}
                </div>
                <h2 className={isScene ? "heading-display text-4xl leading-none text-white md:text-6xl" : "heading-display text-3xl leading-none md:text-4xl"}>{title}</h2>
                <p className={isScene ? "mt-3 max-w-xl text-sm text-orange-50/78 md:text-base" : "mt-2 max-w-xl text-sm text-muted-foreground"}>
                  {metadata || playlistTrack?.title || subtitle}
                </p>
              </div>
            </div>

            <div className={isScene ? "flex flex-col items-start gap-3 2xl:items-end" : "flex flex-col gap-3 md:items-end"}>
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  className={
                    isScene
                      ? "h-16 w-16 rounded-full bg-gradient-to-br from-amber-200 via-orange-500 to-red-600 text-black shadow-[0_0_0_9px_rgba(251,146,60,0.12),0_18px_50px_rgba(249,115,22,0.38)] hover:scale-[1.03] hover:brightness-110"
                      : "h-12 w-12 rounded-lg"
                  }
                  onClick={togglePlayback}
                  disabled={!currentSource}
                  data-testid="button-radio-station-play"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                {isScene && (
                  <div className="hidden rounded-full border border-orange-300/25 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-100 2xl:block">
                    Toca para escuchar en vivo
                  </div>
                )}
                {playlist.length > 1 && (
                  <Button size="icon" variant="outline" className="h-10 w-10" onClick={() => void playNext()}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10"
                  onClick={() => setMuted((value) => !value)}
                  data-testid="button-radio-station-mute"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <input
                  aria-label="Volumen de la radio"
                  className={isScene ? "w-28 accent-orange-400" : "w-28 accent-primary"}
                  type="range"
                  min={0}
                  max={100}
                  value={muted ? 0 : volume}
                  onChange={(event) => {
                    setVolume(Number(event.target.value));
                    setMuted(false);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                {status === "error" && (
                  <Button size="sm" variant="outline" onClick={retry} className="gap-2">
                    <RotateCw className="h-3 w-3" />
                    Reintentar
                  </Button>
                )}
                {currentSource && (
                  <Button size="sm" variant="ghost" onClick={() => window.open(currentSource, "_blank")} className="gap-2">
                    <ExternalLink className="h-3 w-3" />
                    Abrir audio
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
