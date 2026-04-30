import { useEffect, useMemo, useState } from "react";
import { Flame, Radio, Signal } from "lucide-react";
import { RadioEmblemSVG } from "@/components/RadioEmblemSVG";
import { DEFAULT_AZURACAST_METADATA_URL } from "@shared/radio";

type SceneSnapshot = {
  online: boolean;
  playlist: string;
  song: string;
  nextSong: string;
  elapsed: number;
  duration: number;
};

function getSongText(song: any) {
  if (!song) return "";
  return song.text || [song.artist, song.title].filter(Boolean).join(" - ") || song.title || "";
}

function parseSnapshot(data: unknown): SceneSnapshot {
  const payload = Array.isArray(data) ? data[0] : data;
  const record = payload && typeof payload === "object" ? (payload as any) : {};
  const nowPlaying = record.now_playing || {};
  return {
    online: Boolean(record.is_online),
    playlist: String(nowPlaying.playlist || "AzuraCast AutoDJ"),
    song: getSongText(nowPlaying.song) || "Avivando el Fuego Radio",
    nextSong: getSongText(record.playing_next?.song) || "Programacion continua",
    elapsed: Math.max(0, Number(nowPlaying.elapsed ?? 0)),
    duration: Math.max(0, Number(nowPlaying.duration ?? 0)),
  };
}

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "--:--";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function SceneBars() {
  return (
    <div className="flex h-16 items-end justify-center gap-1.5 md:h-28 md:gap-2" aria-hidden>
      {Array.from({ length: 34 }).map((_, index) => (
        <span
          key={index}
          className="w-2 rounded-full bg-gradient-to-t from-red-600 via-orange-400 to-amber-200 shadow-[0_0_18px_rgba(249,115,22,0.45)] animate-radio-bar"
          style={{
            height: `${28 + ((index * 23) % 68)}%`,
            animationDelay: `${index * 48}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default function RadioLiveScene() {
  const [snapshot, setSnapshot] = useState<SceneSnapshot>({
    online: false,
    playlist: "AzuraCast AutoDJ",
    song: "Avivando el Fuego Radio",
    nextSong: "Programacion continua",
    elapsed: 0,
    duration: 0,
  });
  const [clock, setClock] = useState(() => new Date());
  const qrUrl = useMemo(() => {
    const url = encodeURIComponent("https://ministerioavivandoelfuego.com/radio");
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${url}`;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        const response = await fetch(DEFAULT_AZURACAST_METADATA_URL, { cache: "no-store" });
        if (!response.ok) return;
        const nextSnapshot = parseSnapshot(await response.json());
        if (!cancelled) setSnapshot(nextSnapshot);
      } catch {
        if (!cancelled) {
          setSnapshot((current) => ({ ...current, online: false }));
        }
      }
    }

    loadSnapshot();
    const metadataTimer = window.setInterval(loadSnapshot, 15000);
    const clockTimer = window.setInterval(() => setClock(new Date()), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(metadataTimer);
      window.clearInterval(clockTimer);
    };
  }, []);

  const time = new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(clock);
  const progress = snapshot.duration > 0 ? Math.min(100, Math.max(0, (snapshot.elapsed / snapshot.duration) * 100)) : 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#08070a] text-white">
      <section className="relative mx-auto flex min-h-screen w-full max-w-[1080px] flex-col justify-between px-6 py-8 md:px-10 md:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(249,115,22,0.34),transparent_34%),radial-gradient(circle_at_50%_82%,rgba(220,38,38,0.22),transparent_38%)]" />
        <div className="absolute inset-0 hero-grid-bg opacity-35" />
        <div className="absolute inset-x-0 top-0 h-2 fire-gradient" />

        <header className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="flex h-20 w-20 items-center justify-center rounded-[1.35rem] border border-orange-300/25 bg-[linear-gradient(145deg,rgba(255,247,237,0.10),rgba(0,0,0,0.40))] shadow-[0_0_60px_rgba(249,115,22,0.24)] backdrop-blur md:h-28 md:w-28">
              <RadioEmblemSVG className="h-[4.6rem] w-[4.6rem] md:h-24 md:w-24" animate />
            </span>
            <div>
              <p className="font-display text-sm uppercase tracking-[0.32em] text-orange-200 md:text-xl">Avivando</p>
              <h1 className="heading-display text-[clamp(3.1rem,10vw,7rem)] leading-none">El Fuego</h1>
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/10 px-4 py-3 text-right backdrop-blur md:px-5 md:py-4">
            <p className="font-display text-[clamp(2rem,6vw,4rem)] leading-none">{time}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.26em] text-orange-200">Radio Live</p>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-6 text-center md:py-10">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-orange-300/25 bg-orange-500/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-orange-100 md:mb-8 md:text-sm">
            <Signal className="h-5 w-5" />
            {snapshot.online ? "Transmitiendo en vivo" : "Conectando senal"}
          </div>

          <div className="mb-6 flex h-48 w-48 items-center justify-center rounded-[2rem] border border-orange-300/25 bg-[linear-gradient(145deg,rgba(255,247,237,0.12),rgba(249,115,22,0.10)_44%,rgba(0,0,0,0.46))] shadow-[0_0_100px_rgba(249,115,22,0.24),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur md:h-72 md:w-72 md:rounded-[2.8rem]">
            <RadioEmblemSVG className="h-44 w-44 md:h-[17rem] md:w-[17rem]" animate />
          </div>

          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-orange-200 md:text-lg">{snapshot.playlist}</p>
          <h2 className="heading-display max-w-4xl text-[clamp(2rem,8vw,5.5rem)] leading-[0.96]">
            {snapshot.song}
          </h2>

          <div className="mt-6 w-full max-w-3xl md:mt-10">
            <SceneBars />
          </div>

          <div className="mt-6 grid w-full max-w-4xl gap-4 text-left md:mt-10 md:grid-cols-[1fr_minmax(16rem,0.72fr)] md:gap-5">
            <div className="rounded-md border border-white/10 bg-white/10 p-4 backdrop-blur md:p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-orange-200">Siguiente</p>
              <p className="line-clamp-2 text-lg font-semibold md:text-2xl">{snapshot.nextSong}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/10 p-4 backdrop-blur md:p-6">
              <div className="mb-3 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.24em] text-orange-200">
                <span>En reproduccion</span>
                <Radio className="h-5 w-5 text-orange-300" />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/12">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-400 to-amber-200 shadow-[0_0_20px_rgba(249,115,22,0.6)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-3 font-display text-2xl leading-none md:text-3xl">
                {formatDuration(snapshot.elapsed)}
                <span className="text-orange-200/70"> / {formatDuration(snapshot.duration)}</span>
              </p>
            </div>
          </div>
        </div>

        <footer className="relative z-10 grid grid-cols-[1fr_8rem] items-end gap-5 md:grid-cols-[1fr_auto] md:gap-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Flame className="h-6 w-6 text-orange-300 md:h-8 md:w-8" />
              <p className="font-display text-xl uppercase tracking-[0.08em] md:text-3xl">Radio cristiana 24/7</p>
            </div>
            <p className="max-w-2xl text-base text-orange-50/85 md:text-2xl">
              Adoracion, alabanza, palabra y avivamiento para toda la familia.
            </p>
            <p className="mt-3 break-all text-sm text-orange-200 md:text-lg">ministerioavivandoelfuego.com/radio</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white p-3 shadow-2xl">
            <img src={qrUrl} alt="QR para escuchar Avivando el Fuego Radio" className="h-28 w-28 md:h-44 md:w-44" />
          </div>
        </footer>
      </section>
    </main>
  );
}
