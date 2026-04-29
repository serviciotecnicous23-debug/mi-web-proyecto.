export type RadioCategoryId =
  | "adoracion"
  | "alabanza"
  | "predicas"
  | "palabras"
  | "devocionales"
  | "testimonios"
  | "jingles";

export type RadioProgram = {
  id: string;
  title: string;
  category: RadioCategoryId;
  days: number[];
  start: string;
  end: string;
  host: string;
  summary: string;
  mood: string;
};

export type RadioCategory = {
  id: RadioCategoryId;
  name: string;
  role: string;
  rotationTarget: string;
  folder: string;
};

export type RotationSlot = {
  minute: string;
  category: RadioCategoryId;
  purpose: string;
};

export type RadioLibraryTrack = {
  id: string;
  title: string;
  fileName: string;
  category: RadioCategoryId;
  url: string;
  size: number;
  createdAt: string;
};

export type RadioStationPayload = {
  name: string;
  slogan: string;
  timezone: string;
  streamUrl: string;
  metadataUrl: string;
  isConfigured: boolean;
  updatedAt: string;
  provider: {
    name: string;
    stationUrl: string;
    streamUrl: string;
    metadataUrl: string;
    isPrimary: boolean;
  };
  library: {
    tracks: RadioLibraryTrack[];
    trackCount: number;
    hasUploadedAudio: boolean;
  };
  liveOverride: {
    isLive: boolean;
    sourceType: string;
    sourceUrl: string;
    title: string;
  };
  now: {
    current: RadioProgram | null;
    next: RadioProgram | null;
  };
  schedule: RadioProgram[];
  categories: RadioCategory[];
  rotationClock: RotationSlot[];
};

export const RADIO_TIMEZONE = "America/Chicago";

export const DEFAULT_AZURACAST_BASE_URL = "https://40.160.2.176.sslip.io";

export const DEFAULT_AZURACAST_STATION_URL = `${DEFAULT_AZURACAST_BASE_URL}/public/avivando_el_fuego`;

export const DEFAULT_AZURACAST_STREAM_URL = `${DEFAULT_AZURACAST_BASE_URL}/listen/avivando_el_fuego/radio.mp3`;

export const DEFAULT_AZURACAST_METADATA_URL = `${DEFAULT_AZURACAST_BASE_URL}/api/nowplaying`;

export const LEGACY_PUBLIC_RADIO_STREAM =
  "https://upload.wikimedia.org/wikipedia/commons/8/82/God_of_Our_Fathers_-_Concert_Band_-_United_States_Air_Force_Heritage_of_America_Band.mp3";

export const DEFAULT_PUBLIC_RADIO_STREAM =
  DEFAULT_AZURACAST_STREAM_URL;

export const RADIO_CATEGORIES: RadioCategory[] = [
  {
    id: "adoracion",
    name: "Adoracion",
    role: "Adoracion actual, ministracion, oracion cantada y momentos de altar.",
    rotationTarget: "Rotacion principal",
    folder: "02_Adoracion/actuales_y_ministracion",
  },
  {
    id: "alabanza",
    name: "Alabanza",
    role: "Cantos nuevos de gozo, celebracion y apertura de bloques.",
    rotationTarget: "Rotacion activa",
    folder: "01_Alabanza/actuales_y_gozo",
  },
  {
    id: "predicas",
    name: "Predicas",
    role: "Predicas nuevas y ensenanzas integradas al AutoDJ.",
    rotationTarget: "Una vez por hora",
    folder: "04_Predicas/pastor_juan_carlos_harrigan",
  },
  {
    id: "palabras",
    name: "Palabras",
    role: "Capsulas cortas de Escritura, reflexiones y exhortaciones.",
    rotationTarget: "10%",
    folder: "media/palabras",
  },
  {
    id: "devocionales",
    name: "Devocionales",
    role: "Lecturas guiadas, oraciones pastorales y meditaciones diarias.",
    rotationTarget: "7%",
    folder: "media/devocionales",
  },
  {
    id: "testimonios",
    name: "Especiales",
    role: "Audios propios, WhatsApp ministerial y material para revision pastoral.",
    rotationTarget: "Rotacion secundaria",
    folder: "08_Especiales/audio_whatsapp_ministerio",
  },
  {
    id: "jingles",
    name: "Jingles",
    role: "Identidad sonora, separadores, IDs de emisora y avisos breves.",
    rotationTarget: "2%",
    folder: "media/jingles",
  },
];

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
export const RADIO_WEEKLY_SCHEDULE: RadioProgram[] = [
  {
    id: "nueva-adoracion-madrugada",
    title: "Nueva Adoracion y Ministracion",
    category: "adoracion",
    days: EVERY_DAY,
    start: "00:00",
    end: "06:00",
    host: "AzuraCast AutoDJ",
    summary: "Adoracion nueva y ministracion para orar, descansar y comenzar el dia.",
    mood: "adoracion",
  },
  {
    id: "nueva-alabanza-manana",
    title: "Nueva Alabanza y Gozo",
    category: "alabanza",
    days: EVERY_DAY,
    start: "06:00",
    end: "10:00",
    host: "AzuraCast AutoDJ",
    summary: "Alabanza nueva, celebracion y canciones de gozo.",
    mood: "gozo",
  },
  {
    id: "predicas-nuevas-media-manana",
    title: "Predicas Nuevas",
    category: "predicas",
    days: EVERY_DAY,
    start: "10:00",
    end: "12:00",
    host: "Archivo nuevo del ministerio",
    summary: "Predicas nuevas y ensenanzas recientes dentro de la rotacion.",
    mood: "ensenanza",
  },
  {
    id: "adoracion-mediodia",
    title: "Adoracion y Ministracion",
    category: "adoracion",
    days: EVERY_DAY,
    start: "12:00",
    end: "16:00",
    host: "AzuraCast AutoDJ",
    summary: "Bloque de adoracion actual y canciones para ministracion.",
    mood: "ministracion",
  },
  {
    id: "especiales-ministerio",
    title: "Audios del Ministerio y Especiales",
    category: "testimonios",
    days: EVERY_DAY,
    start: "16:00",
    end: "18:00",
    host: "Ministerio Avivando el Fuego",
    summary: "Audios propios, mensajes y contenido especial para la comunidad.",
    mood: "ministerial",
  },
  {
    id: "alabanza-tarde",
    title: "Alabanza y Adoracion Nueva",
    category: "alabanza",
    days: EVERY_DAY,
    start: "18:00",
    end: "22:00",
    host: "AzuraCast AutoDJ",
    summary: "Rotacion nueva para acompanamiento familiar y evangelismo digital.",
    mood: "acompanamiento",
  },
  {
    id: "cierre-adoracion",
    title: "Cierre en Adoracion",
    category: "adoracion",
    days: EVERY_DAY,
    start: "22:00",
    end: "00:00",
    host: "AzuraCast AutoDJ",
    summary: "Cierre del dia con adoracion nueva, oracion y ministracion.",
    mood: "reposo",
  },
];

export const RADIO_ROTATION_CLOCK: RotationSlot[] = [
  { minute: "00", category: "jingles", purpose: "Identificacion de Avivando el Fuego Radio" },
  { minute: "04", category: "adoracion", purpose: "Adoracion nueva y ministracion" },
  { minute: "18", category: "alabanza", purpose: "Alabanza y gozo" },
  { minute: "32", category: "testimonios", purpose: "Audio especial del ministerio" },
  { minute: "45", category: "predicas", purpose: "Predica nueva o ensenanza pastoral" },
];

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function getTimeInZone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekdayText = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const hourText = parts.find((part) => part.type === "hour")?.value ?? "0";
  const minuteText = parts.find((part) => part.type === "minute")?.value ?? "0";
  const hour = Number(hourText) === 24 ? 0 : Number(hourText);

  return {
    weekday: weekdayMap[weekdayText] ?? 0,
    minutes: hour * 60 + Number(minuteText),
  };
}

function programIsActive(program: RadioProgram, weekday: number, minutes: number): boolean {
  const start = timeToMinutes(program.start);
  const end = timeToMinutes(program.end);

  if (start < end) {
    return program.days.includes(weekday) && minutes >= start && minutes < end;
  }

  return (
    (program.days.includes(weekday) && minutes >= start) ||
    (program.days.includes((weekday + 6) % 7) && minutes < end)
  );
}

export function getRadioNow(
  date = new Date(),
  timezone = RADIO_TIMEZONE,
  schedule = RADIO_WEEKLY_SCHEDULE,
) {
  const { weekday, minutes } = getTimeInZone(date, timezone);
  const current = schedule.find((program) => programIsActive(program, weekday, minutes)) ?? null;

  let next: RadioProgram | null = null;
  let nearestDelta = Number.POSITIVE_INFINITY;

  for (const program of schedule) {
    const start = timeToMinutes(program.start);
    for (const day of program.days) {
      let delta = ((day - weekday + 7) % 7) * 1440 + start - minutes;
      if (delta <= 0) delta += 7 * 1440;
      if (delta < nearestDelta) {
        nearestDelta = delta;
        next = program;
      }
    }
  }

  return { current, next };
}
