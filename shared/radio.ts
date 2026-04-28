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
  zeno: {
    stationUrl: string;
    streamUrl: string;
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

export const DEFAULT_ZENO_STATION_URL = "https://zeno.fm/radio/avivando-el-fuego-radio/";

export const DEFAULT_ZENO_STREAM_URL = "https://stream.zeno.fm/kcq8uq8vnogtv";

export const LEGACY_PUBLIC_RADIO_STREAM =
  "https://upload.wikimedia.org/wikipedia/commons/8/82/God_of_Our_Fathers_-_Concert_Band_-_United_States_Air_Force_Heritage_of_America_Band.mp3";

export const DEFAULT_PUBLIC_RADIO_STREAM =
  DEFAULT_ZENO_STREAM_URL;

export const RADIO_CATEGORIES: RadioCategory[] = [
  {
    id: "adoracion",
    name: "Adoracion",
    role: "Adoracion vocal, ministracion, oracion cantada y momentos de altar.",
    rotationTarget: "35%",
    folder: "media/adoracion",
  },
  {
    id: "alabanza",
    name: "Alabanza",
    role: "Coros, alabanzas vocales, gozo, celebracion y apertura de bloques.",
    rotationTarget: "25%",
    folder: "media/alabanza",
  },
  {
    id: "predicas",
    name: "Predicas",
    role: "Mensajes completos, series biblicas y cultos editados para radio.",
    rotationTarget: "18%",
    folder: "media/predicas",
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
    name: "Testimonios",
    role: "Historias editadas de restauracion, familia y fe.",
    rotationTarget: "3%",
    folder: "media/testimonios",
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
const WEEKDAYS = [1, 2, 3, 4, 5];

export const RADIO_WEEKLY_SCHEDULE: RadioProgram[] = [
  {
    id: "madrugada-adoracion",
    title: "Adoracion de Madrugada",
    category: "adoracion",
    days: EVERY_DAY,
    start: "00:00",
    end: "05:30",
    host: "Radio Avivando el Fuego",
    summary: "Adoracion vocal y ministracion para orar, descansar y comenzar el dia en paz.",
    mood: "quieto",
  },
  {
    id: "fuego-amanecer",
    title: "Fuego al Amanecer",
    category: "devocionales",
    days: EVERY_DAY,
    start: "05:30",
    end: "07:00",
    host: "Equipo Devocional",
    summary: "Lectura biblica, oracion breve y palabra de animo para la familia.",
    mood: "devocional",
  },
  {
    id: "alabanza-manana",
    title: "Alabanza para Comenzar",
    category: "alabanza",
    days: EVERY_DAY,
    start: "07:00",
    end: "10:00",
    host: "Radio Avivando el Fuego",
    summary: "Musica cristiana alegre para levantar la fe al iniciar la jornada.",
    mood: "gozo",
  },
  {
    id: "palabra-discipulado",
    title: "Palabra y Discipulado",
    category: "palabras",
    days: WEEKDAYS,
    start: "10:00",
    end: "12:00",
    host: "Maestros del Ministerio",
    summary: "Capsulas biblicas, fundamentos de fe y recursos de capacitacion.",
    mood: "ensenanza",
  },
  {
    id: "culto-dominical",
    title: "Culto Dominical",
    category: "predicas",
    days: [0],
    start: "10:00",
    end: "12:00",
    host: "Ministerio Avivando el Fuego",
    summary: "Bloque reservado para culto, predicacion o retransmision dominical.",
    mood: "culto",
  },
  {
    id: "fuego-mediodia",
    title: "Fuego al Mediodia",
    category: "palabras",
    days: EVERY_DAY,
    start: "12:00",
    end: "13:00",
    host: "Equipo Pastoral",
    summary: "Una hora de palabra corta, oracion y musica de esperanza.",
    mood: "renuevo",
  },
  {
    id: "musica-esperanza",
    title: "Musica de Esperanza",
    category: "adoracion",
    days: EVERY_DAY,
    start: "13:00",
    end: "16:00",
    host: "Radio Avivando el Fuego",
    summary: "Seleccion continua de adoracion vocal, alabanza y mensajes breves.",
    mood: "acompanamiento",
  },
  {
    id: "predicas-avivamiento",
    title: "Predicas Avivando el Fuego",
    category: "predicas",
    days: EVERY_DAY,
    start: "16:00",
    end: "18:00",
    host: "Archivo Ministerial",
    summary: "Mensajes completos editados para radio y series de crecimiento espiritual.",
    mood: "palabra",
  },
  {
    id: "familia-fe",
    title: "Alabanza y Familia",
    category: "alabanza",
    days: EVERY_DAY,
    start: "18:00",
    end: "20:00",
    host: "Radio Avivando el Fuego",
    summary: "Musica y reflexiones para hogares, grupos pequenos e iglesias aliadas.",
    mood: "familia",
  },
  {
    id: "noche-avivamiento",
    title: "Noche de Avivamiento",
    category: "predicas",
    days: [3, 6],
    start: "20:00",
    end: "22:00",
    host: "Ministerio Avivando el Fuego",
    summary: "Bloque fuerte para cultos, predicas, intercesion y transmisiones especiales.",
    mood: "avivamiento",
  },
  {
    id: "adoracion-nocturna",
    title: "Adoracion Nocturna",
    category: "adoracion",
    days: EVERY_DAY,
    start: "22:00",
    end: "00:00",
    host: "Radio Avivando el Fuego",
    summary: "Cierre del dia con adoracion, salmos y palabra de consuelo.",
    mood: "reposo",
  },
];

export const RADIO_ROTATION_CLOCK: RotationSlot[] = [
  { minute: "00", category: "jingles", purpose: "ID legal y frase del ministerio" },
  { minute: "01", category: "alabanza", purpose: "Apertura musical con energia" },
  { minute: "13", category: "adoracion", purpose: "Transicion a ambiente de oracion" },
  { minute: "25", category: "palabras", purpose: "Capsula biblica de 2 a 5 minutos" },
  { minute: "31", category: "alabanza", purpose: "Segundo bloque musical" },
  { minute: "43", category: "predicas", purpose: "Extracto o predica editada" },
  { minute: "56", category: "jingles", purpose: "Separador, redes y proximo bloque" },
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
