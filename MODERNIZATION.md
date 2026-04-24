# Plan de Modernización — Ministerio Avivando el Fuego

**Fecha:** 24 de abril de 2026
**Stack actual:** Node 20.19 · React 18.3 · TypeScript 5.6 · Vite 7.3 · Tailwind 3.4 · Express 5.0 · Drizzle 0.39
**Deploy:** Render (Oregon) + Postgres starter · auto-deploy desde GitHub `main`

Este documento es el plan maestro para mantener la app al día sin romper producción. Está dividido en tres tiers por nivel de riesgo. **Tier 1 ya fue aplicado en el commit que introdujo este archivo.** Tier 2 y Tier 3 son planeados, con criterios de aceptación antes de ejecutarlos.

---

## Tabla de estado del stack (abril 2026)

| Paquete / runtime | Instalado | Latest estable | Siguiente LTS / hito | Tier |
|---|---|---|---|---|
| Node.js | 20.19.0 | 22.x LTS | 24 LTS (oct 2026) | 2 |
| React | 18.3.1 | 19.2.5 | 19.x | 2 |
| TypeScript | 5.6.3 | 6.0.3 | 7.0 beta (21-abr-2026) | 2 / 3 |
| Vite | 7.3.0 | 8.0.9 (Rolldown) | requiere Node 20.19+ / 22.12+ | 2 |
| Tailwind CSS | 3.4.17 | 4.2.0 (Lightning CSS) | — | 3 |
| Express | 5.0.1 | 5.2.1 | — | 2 |
| @tanstack/react-query | 5.60.5 | 5.99.2 | — | 2 |
| Drizzle ORM | 0.39.3 | 0.45.2 estable / 1.0.0-beta.2 | 1.0 GA | 2 / 3 |
| wouter | 3.3.5 | 3.9.0 | — | 2 |
| Zod | 3.24.2 | 3.x | 4.x (breaking) | 2 |

---

## Tier 1 — APLICADO ✅ (cambios seguros inmediatos)

Todos estos cambios están aplicados en este commit. Sin riesgo para producción.

### 1.1 Alineación de versión de Node en los tres puntos de verdad
- `.nvmrc` → `20.19.0`
- `package.json` → `"engines": { "node": ">=20.19.0" }`
- `render.yaml` → `NODE_VERSION: "20.19.0"`

**Por qué:** antes estaban en 20.11.0 (parche de agosto 2024). 20.19.0 es el parche actual de la misma línea LTS (cero breaking changes), y es el mínimo requerido por Vite 8 — dejarlo listo nos desbloquea el camino.

### 1.2 Limpieza de dependencias muertas (ya fue aplicado en commit anterior)
- Removidos los 3 plugins de Replit (`@replit/vite-plugin-*`) y `@tailwindcss/vite` sin uso.
- `vite.config.ts` ahora usa `plugins: [react()]` limpio.
- Borrados 8 archivos huérfanos en `client/` (package.json, vite.config.ts, tsconfig.json, postcss.config.js, tailwind.config.js, build.ts antiguo, drizzle.config.ts duplicado).

### 1.3 Añadido este roadmap
`MODERNIZATION.md` en la raíz para tener un único lugar donde vivan los planes de actualización.

---

## Tier 2 — PLANEADO (riesgo medio, requiere una tarde de pruebas)

Cada uno se puede hacer en un PR independiente. Orden recomendado abajo. Después de cada uno: `npm run check`, `npm run build`, smoke test local, y luego deploy a Render.

### 2.1 Bumps menores y de parche (primer PR — el más seguro del tier)
Actualizar a las últimas versiones menores dentro de la misma major. Sin breaking changes documentados.

```
@tanstack/react-query  5.60.5 → 5.99.2
wouter                 3.3.5  → 3.9.0
express                5.0.1  → 5.2.1
drizzle-orm            0.39.3 → 0.45.2
@radix-ui/*            (bumps menores disponibles)
helmet                 ya 8.1.0 (ok)
```

**Criterio de aceptación:** `npm run build` pasa, rutas protegidas siguen funcionando, sesión persiste.

### 2.2 Migración a Node 22 LTS
Node 22 es LTS desde abril 2025 y estará en soporte activo hasta abril 2027. Render ya lo soporta.

- `.nvmrc` → `22.12.0`
- `package.json engines` → `">=22.12.0"`
- `render.yaml NODE_VERSION` → `"22.12.0"`

**Riesgos:** `better-sqlite3` y `sharp` requieren recompilar — Render lo hace automáticamente en build. Probar backups de Postgres en local antes.

**Criterio de aceptación:** build de Render completa sin errores de N-API, `/api/hello` responde 200.

### 2.3 Vite 7 → 8 (después de 2.2)
Vite 8 usa Rolldown (Rust) en lugar de Rollup para producción. Típicamente 3-5× más rápido en builds grandes. Requiere Node 20.19+ o 22.12+ (ya lo tenemos).

- `vite` → `^8.0.9`
- `@vitejs/plugin-react` → la versión compatible con Vite 8

**Riesgos:** algunos plugins legacy no funcionan con Rolldown; en nuestro caso solo usamos `@vitejs/plugin-react` oficial, así que debería ser directo.

**Criterio de aceptación:** el bundle producido en `dist/public/` tiene tamaño similar o menor, y la página carga correctamente en un deploy preview.

### 2.4 TypeScript 5.6 → 5.9 (parche/menor)
5.9 es la última línea 5.x estable. Sin breaking changes respecto a 5.6 en nuestro código (no usamos features marcadas deprecated).

- `typescript` → `^5.9.0`

No subimos a 6.0 todavía — 6.0 elimina features antiguas que podrían estar en dependencias transitivas. 5.9 es el sweet spot.

**Criterio de aceptación:** `npm run check` (tsc) pasa sin errores nuevos.

### 2.5 React 18 → 19
React 19 está estable desde diciembre 2024. Trae `use()`, Actions, mejor soporte de Suspense, y compilación con React Compiler (opcional).

- `react` + `react-dom` → `^19.2.5`
- `@types/react` + `@types/react-dom` → `^19.x`
- Correr `npx types-react-codemod preset-19 ./client/src` para ajustar tipos automáticamente

**Riesgos reales en nuestro código:**
- `ErrorBoundary` de clase en `App.tsx` → sigue funcionando en 19, pero es momento de migrar a `react-error-boundary`
- `Suspense` con lazy routes — después de esto podemos hacer el cambio a rutas lazy
- Chequear compatibilidad de Radix UI, framer-motion, react-hook-form (todos soportan 19 desde 2025)

**Criterio de aceptación:** todas las rutas renderizan sin warnings en consola, Sentry no recibe errores de hydration.

### 2.6 Zod 3 → 4 (opcional, último del tier)
Zod 4 trae `.safeParseAsync` mejorado y mejor inferencia. Breaking: cambio en mensajes de error por defecto.

- Hacer junto con `drizzle-zod` compatible

---

## Tier 3 — PROYECTOS MAYORES (riesgo alto, dedicar un sprint)

No son bumps de versión — son reescrituras parciales. Cada uno merece su propia rama larga y QA manual completo.

### 3.1 Tailwind CSS 3 → 4 (Lightning CSS)
Tailwind 4 es prácticamente una reescritura. Usa Lightning CSS (Rust) en lugar de PostCSS. El build es 5× más rápido, pero:

- El archivo de config cambia de `tailwind.config.js` a directivas CSS (`@theme`)
- Plugins de la v3 (como `@tailwindcss/typography`, `tailwindcss-animate`) deben ser reemplazados por sus equivalentes v4
- Clases custom y `@apply` requieren revisión

**Plan:** crear rama `tailwind-v4`, correr codemod oficial (`npx @tailwindcss/upgrade`), revisar visualmente cada página. No hacer en producción sin testing extenso — es la mayor superficie de breakage.

### 3.2 Drizzle ORM 0.x → 1.0
Drizzle 1.0 ya tiene beta (`1.0.0-beta.2`). El API de queries se estabilizó, pero hay cambios en:
- `drizzle-kit push` reemplazado parcialmente por `migrate`
- Algunos types de `InferInsertModel` cambiaron

Esperar a que Drizzle 1.0 GA salga (roadmap apunta a mediados de 2026). Cuando salga: migrar schema por schema, no todo de una.

### 3.3 TypeScript 7 (Go-native compiler)
TS 7 está en beta desde el 21 de abril de 2026. Compilador reescrito en Go — 10× más rápido. Todavía tiene rough edges con decoradores y algunos types complejos.

**Esperar a GA (probablemente Q3 2026)** antes de mover producción.

---

## Mejoras a nivel de código (independientes de versiones)

Estas no son bumps — son refactors de arquitectura que encontramos durante la auditoría. Se pueden hacer en cualquier momento.

### C.1 Code-splitting de rutas en `client/src/App.tsx`
Actualmente las 35+ páginas se importan eagerly al inicio, haciendo que `vendor-*` se cargue completo. Usar `React.lazy()` + `Suspense` con un fallback elegante reduciría el bundle inicial significativamente.

```tsx
const Home = lazy(() => import('./pages/Home'));
const Sermones = lazy(() => import('./pages/Sermones'));
// ... etc
```

### C.2 Modernizar `ErrorBoundary`
Migrar de clase manual a `react-error-boundary` (más flexible, integración limpia con Sentry).

### C.3 Service Worker `setInterval` para updates
En `main.tsx`, el `setInterval(update, 5*60*1000)` corre para siempre. Considerar usar `workbox-window` que maneja el lifecycle correctamente y evita loops.

### C.4 `data/users.json` trackeado en repo (seguridad)
Auditoría pendiente separada. No modernización, pero alto riesgo si tiene datos reales.

### C.5 Rutas móviles rotas
`/sermones`, `/grupos`, `/calendario`, `/alianza` aparecen en la nav móvil pero no resuelven — a limpiar cuando hagamos el code-split.

### C.6 TikTok Live en `LiveStreamEmbed.tsx`
A remover como opción de stream (solo YouTube debe quedar, según pidió Luis), y añadir Media Session API para audio en segundo plano.

---

## Cómo ejecutar este plan

1. **Tier 1** — ya está hecho en este commit. Render hará auto-deploy y la app queda en Node 20.19.
2. **Tier 2** — hacer PRs en el orden 2.1 → 2.2 → 2.3 → 2.4 → 2.5. Cada uno con su propio deploy preview.
3. **Tier 3** — planear cada uno como proyecto independiente con estimación de tiempo.

Para cualquier cambio, la regla no negociable: **correr `npm run check` y `npm run build` localmente antes de pushear a `main`.** Render hace auto-deploy y un build roto tumba producción.

---

*Última actualización: 24 de abril de 2026*
