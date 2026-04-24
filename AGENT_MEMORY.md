# AGENT MEMORY — protocolo del ecosistema de agentes

**Este archivo es la primera cosa que CUALQUIER agente debe leer al arrancar una sesión.**

Vives en un ecosistema con otros agentes (bot de Telegram, Claude en Cowork, futuros workers en background). Comparten memoria a través de la base de datos Postgres del proyecto. El objetivo es que el trabajo sobreviva a cortes de sesión, créditos agotados, laptops apagadas.

El dueño y único autorizante humano es **Luis** (luis27182454@gmail.com). Es él quien aprueba/deniega acciones de riesgo.

---

## 1. Al empezar cualquier tarea

Haz esto en orden, SIEMPRE:

1. Lee este archivo completo (`AGENT_MEMORY.md`).
2. Identifícate con un `agentId` único (ejemplos: `bot-telegram`, `claude-cowork`, `claude-worker-content`).
3. Consulta las misiones abiertas: `GET /api/agent/missions?status=in_progress` y `GET /api/agent/missions?status=pending`.
4. Si Luis te está asignando una tarea nueva, **crea una misión** antes de ejecutar:
   `POST /api/agent/missions` con `{ title, description, createdBy: "luis", assignedTo: "<tu agentId>" }`.
5. Toma el `id` devuelto. Todo lo que hagas a partir de ahí se asocia a ese id.

## 2. Durante la tarea

- Cuando avances, **appendea notas** a la misión:
  `PATCH /api/agent/missions/:id` con `{ appendNote: "descripción corta del paso completado", status: "in_progress" }`.
- Los `appendNote` se concatenan con timestamp y agentId; son la bitácora del trabajo.
- Si te bloqueas (esperando input, error externo), marca `status: "blocked"` con una nota explicando qué necesitas.

## 3. Antes de cualquier acción de riesgo — OBLIGATORIO

Antes de ejecutar cualquier acción de la siguiente lista, DEBES llamar al **Revisor**:

- `git_push` (cualquier push, pero especialmente a `main`)
- `git_force_push` (siempre, nunca se permite sobre main)
- `file_delete` (borrar archivos del repo)
- `file_overwrite_critical` (sobrescribir `package.json`, `render.yaml`, `.env`, `shared/schema.ts`, etc.)
- `db_migration` (cambios de schema que alteren datos)
- `db_destructive` (DROP, TRUNCATE, DELETE sin WHERE)
- `social_post` (publicar en YouTube, TikTok, Instagram, Facebook)
- `email_send_bulk` (envío masivo de correos)
- `env_change` (cambios a variables de entorno en Render)
- `deploy` (triggers manuales de deploy fuera del auto-deploy de Render)
- `custom` (cualquier otra cosa que pueda ser irreversible)

**Cómo pedir revisión:**

```
POST /api/agent/reviews
Authorization: Bearer $AGENT_API_KEY
X-Agent-Id: <tu agentId>
Body: {
  "actionType": "git_push",
  "summary": "push de 2 commits a main: bump Node a 20.19 + roadmap",
  "payload": "<diff completo o contenido a publicar>",
  "missionId": 42
}
```

La respuesta tiene **3 formas posibles**:

| Respuesta | Qué hacer |
|---|---|
| `{ "status": "approve" }` | Proceder inmediatamente. El revisor automático no encontró riesgos. |
| `{ "status": "block", "reasons": [...] }` | **NUNCA ejecutar.** Es un patrón que el sistema bloquea de raíz (ej: force push a main). Actualiza la misión con las razones y reporta a Luis. |
| `{ "status": "pending", "reviewId": N }` | La acción necesita aprobación humana. Luis ya fue notificado por Telegram. **Polea `GET /api/agent/reviews/:id` hasta que `decision` sea `approved` o `denied`.** Timeout por defecto: 24 h → pasa a `expired` → tratar como `denied`. |

**NUNCA ejecutes una acción de riesgo sin una review con `decision: approved` o `status: approve`.**

## 4. Al terminar

- Marca la misión `status: "done"` con un `appendNote` de resumen.
- Si fallaste, usa `status: "blocked"` con nota explicando el error. No marques `done` si no terminaste.

## 5. Autenticación

Todos los endpoints `/api/agent/*` requieren:

- Header `Authorization: Bearer <AGENT_API_KEY>` (valor en Render dashboard, env `AGENT_API_KEY`).
- Header `X-Agent-Id: <tu identificador>` (recomendado, no obligatorio pero facilita auditar).

## 6. Patrones comunes

**Ejemplo: bot de Telegram antes de un push**

```
1. git diff --stat origin/main  → resume
2. git diff origin/main         → capturar como `payload`
3. POST /api/agent/reviews con actionType: "git_push"
4. Si response.status === "approve" → git push origin main
5. Si response.status === "pending" → esperar: GET /api/agent/reviews/:id cada 30s
6. Si response.status === "block" → reportar razones a Luis, no hacer push
```

**Ejemplo: creador de contenido antes de publicar**

```
1. Redacta el post / guion
2. POST /api/agent/reviews con actionType: "social_post" y payload: <texto completo>
3. Siempre escalara a humano (politica dura)
4. Cuando Luis apruebe, ejecutar la publicacion
```

## 7. Límites duros que este protocolo impone

- El Revisor bloquea automáticamente force-push contra main.
- Escala a humano: cualquier toque a archivos críticos, borrado neto > 100 líneas, vaciado de archivos, publicación pública, envío masivo, cambios de env.
- El humano tiene 24 h para decidir antes del auto-denied.

## 8. Qué NO vive aquí

- Secretos, tokens, passwords. Esos van en variables de entorno de Render.
- Datos de usuarios de la web. Eso tiene sus propias tablas (`users`, `events`, etc.) — no las mezcles.

## 9. Si algo parece roto

Llama a `GET /api/agent/health` primero. Si `telegramConfigured: false`, el dueño debe set `TELEGRAM_BOT_TOKEN` y `TELEGRAM_OWNER_CHAT_ID` en Render.

Si el endpoint entero no responde (503 con `agent_api_disabled`), falta `AGENT_API_KEY`. Render lo genera automáticamente al deploy porque en `render.yaml` está como `generateValue: true` — pero si por alguna razón no está, el dueño debe crearlo.

---

*Última actualización: 24 de abril de 2026 — Fase 1 del ecosistema de agentes*
