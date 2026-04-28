# Radio Avivando el Fuego - Station Kit

Este kit organiza la operacion de la emisora cristiana online del ministerio:

- Carpetas por tipo de contenido: adoracion, alabanza, predicas, palabras, devocionales, testimonios y jingles.
- Plantillas para catalogar audios, preparar bloques y generar playlists.
- Un servidor local de prueba para escuchar una senal MP3 desde el ordenador.
- Guia para conectar la web a un stream real en produccion.

## Flujo recomendado

1. Descarga el paquete inicial legal:

```powershell
powershell -ExecutionPolicy Bypass -File .\radio-station-kit\scripts\download-public-domain-starter-pack.ps1
```

2. Agrega tus audios propios o con permiso en las carpetas de `radio-station-kit\media`.

3. Para usarlos dentro de la web sin tocar codigo, entra como admin en `/admin`, abre `Biblioteca Radio` y sube los audios por categoria.

4. Genera playlists locales si quieres probar una senal desde el ordenador:

```powershell
powershell -ExecutionPolicy Bypass -File .\radio-station-kit\scripts\build-playlists.ps1
```

5. Prueba una senal local:

```powershell
node .\radio-station-kit\scripts\local-radio-server.mjs
```

La senal local queda en:

```text
http://localhost:8787/radio.mp3
```

En desarrollo local puedes pegar esa URL en `/admin`, pestana `En Vivo`, campo `URL de la Radio`.
En produccion necesitas una URL HTTPS publica, por ejemplo desde AzuraCast, Icecast o un proveedor de radio.

## Produccion recomendada

Para una radio 24/7 publica, la opcion mas completa es AzuraCast en un VPS:

- AutoDJ y programacion.
- Biblioteca musical con metadatos.
- Icecast integrado.
- URL publica tipo `https://radio.tudominio.com/listen/avivando/radio.mp3`.
- Metadata JSON para mostrar la cancion actual.

La web ya queda preparada para consumir `RADIO_STREAM_URL` y `RADIO_METADATA_URL` como variables de entorno, o para guardar la URL desde el panel `/admin`.

## Regla legal

No uses musica comercial, pistas de YouTube, Spotify, Apple Music ni canciones modernas sin licencia escrita. Este kit solo descarga archivos marcados como dominio publico o de uso libre comprobable. Para el ministerio, lo mas sano es trabajar con:

- Grabaciones propias.
- Musica con licencia CCLI/streaming cuando aplique.
- Dominio publico real.
- Creative Commons compatible con retransmision.
- Permisos por escrito de artistas o ministerios.
