import { createReadStream, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kitRoot = path.resolve(__dirname, "..");
const mediaRoot = path.join(kitRoot, "media");
const port = Number(process.env.RADIO_PORT || 8787);

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".mp3")) return [fullPath];
    return [];
  });
}

function loadTracks() {
  try {
    return walk(mediaRoot)
      .map((file) => ({ file, size: statSync(file).size }))
      .filter((track) => track.size > 0)
      .sort((a, b) => a.file.localeCompare(b.file));
  } catch {
    return [];
  }
}

function json(res, data, status = 200) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  });
  res.end(JSON.stringify(data, null, 2));
}

function streamRadio(req, res) {
  const tracks = loadTracks();
  if (tracks.length === 0) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("No hay archivos MP3 en radio-station-kit/media.");
    return;
  }

  const headers = {
    "content-type": "audio/mpeg",
    "cache-control": "no-cache, no-store, must-revalidate",
    "pragma": "no-cache",
    "icy-name": "Radio Avivando el Fuego Local",
    "icy-genre": "Christian",
    "access-control-allow-origin": "*",
  };

  if (req.method === "HEAD") {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  let stopped = false;
  let reader = null;
  let index = Math.floor(Date.now() / 180000) % tracks.length;

  req.on("close", () => {
    stopped = true;
    if (reader) reader.destroy();
  });

  res.writeHead(200, headers);

  const playNext = () => {
    if (stopped) return;
    const track = tracks[index % tracks.length];
    index++;
    reader = createReadStream(track.file);
    reader.on("error", playNext);
    reader.on("end", playNext);
    reader.pipe(res, { end: false });
  };

  playNext();
}

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/radio.mp3") {
    streamRadio(req, res);
    return;
  }

  if (url.pathname === "/status.json") {
    const tracks = loadTracks();
    json(res, {
      station: "Radio Avivando el Fuego Local",
      streamUrl: `http://localhost:${port}/radio.mp3`,
      tracks: tracks.length,
      mediaRoot,
    });
    return;
  }

  if (url.pathname === "/playlist.m3u") {
    const tracks = loadTracks();
    res.writeHead(200, {
      "content-type": "audio/x-mpegurl; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    });
    res.end(tracks.map((track) => track.file).join("\n"));
    return;
  }

  json(res, {
    station: "Radio Avivando el Fuego Local",
    endpoints: ["/radio.mp3", "/status.json", "/playlist.m3u"],
  });
});

server.listen(port, () => {
  console.log(`Radio local: http://localhost:${port}/radio.mp3`);
  console.log(`Estado:      http://localhost:${port}/status.json`);
});
