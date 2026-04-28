# Streaming recomendado

## Produccion

Usa AzuraCast en un VPS o proveedor administrado de radio. Configuracion sugerida:

- Station name: `Radio Avivando el Fuego`
- Mount point: `/radio.mp3`
- AutoDJ: activo
- Crossfade: 3 a 5 segundos
- Bitrate: 128 kbps MP3 para maxima compatibilidad
- Metadata API: activa si el proveedor la ofrece

Despues configura en Render:

```text
RADIO_STREAM_URL=https://radio.tudominio.com/listen/avivando/radio.mp3
RADIO_METADATA_URL=https://radio.tudominio.com/api/nowplaying/avivando
RADIO_TIMEZONE=America/Chicago
```

Tambien puedes pegar la URL de stream desde `/admin` en la pestana `En Vivo`.

## Eventos en vivo

Para cultos y predicas en directo:

- OBS Studio para capturar camara/audio.
- Restream para enviar simultaneamente a YouTube/Facebook/TikTok.
- La pagina `/en-vivo` ya acepta YouTube, Facebook, TikTok, Restream, HLS y radio.

## Laboratorio local

Para pruebas sin VPS usa:

```powershell
node .\radio-station-kit\scripts\local-radio-server.mjs
```

Esto sirve una senal MP3 local. No es suficiente para publico externo porque `localhost` solo existe en tu ordenador.
