# Integracion web con Zeno

Estacion publica:

- https://zeno.fm/radio/avivando-el-fuego-radio/

Stream directo:

- https://stream.zeno.fm/kcq8uq8vnogtv

## Vista local

La vista local `http://localhost:5178/radio` esta corriendo con:

```powershell
$env:RADIO_STREAM_URL='https://stream.zeno.fm/kcq8uq8vnogtv'
node dist/index.cjs
```

## Produccion

En el servidor oficial de la web, configurar esta variable de entorno:

```text
RADIO_STREAM_URL=https://stream.zeno.fm/kcq8uq8vnogtv
```

Despues de desplegar, la pagina `/radio` y el bloque de radio en vivo usaran el stream externo de Zeno.

## Nota de AutoDJ

AutoDJ puede pausarse cuando no hay oyentes activos y reanudarse cuando alguien entra a escuchar, segun la documentacion de Zeno.
