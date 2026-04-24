/**
 * Agent Reviewer — guardia previa a acciones destructivas o irreversibles.
 *
 * Diseñado despues del incidente del 22-abr-2026 donde el bot de Telegram
 * borro todo el contenido de package.json (commit e1723ca0) y tumbo el
 * deploy de Render. Este modulo es la primera linea de defensa.
 *
 * Reglas:
 *   - Examina un diff o payload propuesto por un agente
 *   - Devuelve una decision: approve (seguro) / block (nunca se permite) /
 *     needs_human (escalar a Luis por Telegram)
 *   - Incluye razones explicitas para cada escalado (auditables)
 *
 * Es una funcion pura: no escribe a la DB, no manda mensajes. Solo razona.
 * El router es quien persiste la decision y notifica.
 */

// Archivos cuyo borrado o reemplazo total casi siempre es un error.
// Si un diff toca uno de estos y reduce significativamente su tamaño,
// se escala a humano automaticamente.
const CRITICAL_FILES = [
  "package.json",
  "package-lock.json",
  "render.yaml",
  ".env",
  ".env.example",
  ".env.production",
  "drizzle.config.mjs",
  "drizzle.config.ts",
  "tsconfig.json",
  "vite.config.ts",
  "server/index.ts",
  "server/db.ts",
  "server/routes.ts",
  "shared/schema.ts",
  "client/src/main.tsx",
  "client/src/App.tsx",
  ".nvmrc",
] as const;

// Patrones de ruta cuyo borrado masivo siempre escala
const CRITICAL_PATH_PREFIXES = [
  "shared/",
  "server/auth",
  "server/storage",
  "data/",
] as const;

export type ReviewStatus = "approve" | "block" | "needs_human";

export interface ReviewInput {
  actionType: string; // git_push, file_delete, social_post, etc.
  summary: string; // descripcion humana corta
  payload?: string; // el diff completo, o mensaje completo a publicar, etc.
  agentId: string;
  // Opcional: para overrides de politica por tipo de accion
  context?: Record<string, unknown>;
}

export interface ReviewResult {
  status: ReviewStatus;
  riskScore: number; // 0 (seguro) a 100 (critico)
  reasons: string[]; // razones especificas
  suggestions?: string[]; // que podria hacer el agente antes de pedir de nuevo
}

interface DiffStats {
  filesChanged: string[];
  linesAdded: number;
  linesRemoved: number;
  filesEmptied: string[]; // archivos cuyo contenido quedo vacio
  criticalFilesTouched: string[];
  pureDeletionFiles: string[]; // archivos con solo removals, ningun add
}

/**
 * Parsea un diff unificado (output de `git diff` o similar) y extrae
 * estadisticas basicas sin depender de libs externas.
 */
export function parseDiffStats(diff: string): DiffStats {
  const stats: DiffStats = {
    filesChanged: [],
    linesAdded: 0,
    linesRemoved: 0,
    filesEmptied: [],
    criticalFilesTouched: [],
    pureDeletionFiles: [],
  };

  if (!diff || typeof diff !== "string") return stats;

  // Split por bloques de archivo: cada bloque empieza con "diff --git"
  const fileBlocks = diff.split(/^diff --git /m).filter(Boolean);

  for (const block of fileBlocks) {
    // Primera linea tiene "a/path b/path"
    const firstLine = block.split("\n")[0] ?? "";
    const match = firstLine.match(/a\/(\S+)\s+b\/(\S+)/);
    const filePath = match?.[2] ?? match?.[1];
    if (!filePath) continue;

    stats.filesChanged.push(filePath);

    // Critico por nombre exacto
    if (CRITICAL_FILES.includes(filePath as (typeof CRITICAL_FILES)[number])) {
      stats.criticalFilesTouched.push(filePath);
    }
    // Critico por prefijo de ruta
    for (const prefix of CRITICAL_PATH_PREFIXES) {
      if (filePath.startsWith(prefix)) {
        if (!stats.criticalFilesTouched.includes(filePath)) {
          stats.criticalFilesTouched.push(filePath);
        }
        break;
      }
    }

    // Contar +/- en el bloque (ignorando headers +++/---)
    let added = 0;
    let removed = 0;
    for (const line of block.split("\n")) {
      if (line.startsWith("+++") || line.startsWith("---")) continue;
      if (line.startsWith("+")) added++;
      else if (line.startsWith("-")) removed++;
    }
    stats.linesAdded += added;
    stats.linesRemoved += removed;

    // Archivo "vaciado": muchas lineas removidas, cero añadidas
    if (removed >= 10 && added === 0) {
      stats.filesEmptied.push(filePath);
    }
    if (removed > 0 && added === 0) {
      stats.pureDeletionFiles.push(filePath);
    }
  }

  return stats;
}

/**
 * Decide automaticamente: approve / block / needs_human.
 * Puro, determinista, testeable.
 */
export function reviewAction(input: ReviewInput): ReviewResult {
  const reasons: string[] = [];
  const suggestions: string[] = [];
  let riskScore = 0;

  // ---------- reglas por tipo de accion ----------

  // Force push a main siempre se bloquea de raiz
  if (input.actionType === "git_force_push") {
    const targetsMain =
      /origin\/main|origin\s+main|--force\s+main|^main$/i.test(
        input.summary || "",
      ) ||
      /--force|-f\s/.test(input.payload || "");
    if (targetsMain) {
      return {
        status: "block",
        riskScore: 100,
        reasons: ["Force push contra main no esta permitido en ningun caso"],
        suggestions: [
          "Crea una rama nueva con el cambio y abre un PR para merge controlado",
        ],
      };
    }
  }

  // Acciones que SIEMPRE requieren humano (sin analizar payload)
  const ALWAYS_HUMAN: string[] = [
    "social_post", // publicar en redes sociales
    "email_send_bulk", // envio masivo de correos
    "env_change", // cambios a variables de entorno en Render
    "db_destructive", // DROP TABLE, TRUNCATE, DELETE sin WHERE
  ];
  if (ALWAYS_HUMAN.includes(input.actionType)) {
    reasons.push(
      `Acciones de tipo '${input.actionType}' siempre requieren aprobacion humana`,
    );
    return {
      status: "needs_human",
      riskScore: 60,
      reasons,
      suggestions,
    };
  }

  // ---------- analisis de payload (diff) para git_push ----------

  if (input.actionType === "git_push" && input.payload) {
    const stats = parseDiffStats(input.payload);

    // Regla 1: archivos criticos tocados → escalar a humano
    if (stats.criticalFilesTouched.length > 0) {
      reasons.push(
        `Toca ${stats.criticalFilesTouched.length} archivo(s) critico(s): ${stats.criticalFilesTouched.slice(0, 5).join(", ")}${stats.criticalFilesTouched.length > 5 ? "..." : ""}`,
      );
      riskScore += 40;
    }

    // Regla 2: archivos vaciados (el caso exacto del desastre de package.json)
    if (stats.filesEmptied.length > 0) {
      reasons.push(
        `Vacia completamente ${stats.filesEmptied.length} archivo(s): ${stats.filesEmptied.join(", ")}`,
      );
      riskScore += 50;
      suggestions.push(
        "Si la intencion es eliminar el archivo, usa 'git rm' explicitamente en el mensaje",
      );
    }

    // Regla 3: borrado masivo neto
    const netDeletion = stats.linesRemoved - stats.linesAdded;
    if (netDeletion > 100) {
      reasons.push(
        `Borrado neto grande: ${netDeletion} lineas (removidas ${stats.linesRemoved} vs añadidas ${stats.linesAdded})`,
      );
      riskScore += Math.min(40, Math.floor(netDeletion / 10));
    }

    // Regla 4: ratio de borrado sobre lineas totales tocadas
    const totalTouched = stats.linesAdded + stats.linesRemoved;
    if (totalTouched > 50) {
      const deletionRatio = stats.linesRemoved / totalTouched;
      if (deletionRatio > 0.8) {
        reasons.push(
          `${Math.round(deletionRatio * 100)}% del diff son borrados (${stats.linesRemoved}/${totalTouched})`,
        );
        riskScore += 20;
      }
    }

    // Regla 5: solamente deleciones en muchos archivos
    if (stats.pureDeletionFiles.length >= 3) {
      reasons.push(
        `${stats.pureDeletionFiles.length} archivos con solo borrados, ninguna adicion`,
      );
      riskScore += 20;
    }

    // Regla 6: tocar mas de 20 archivos en un solo push suele ser señal
    // de normalizacion de line endings u otro cambio de bajo valor
    if (stats.filesChanged.length > 20) {
      reasons.push(
        `Cambios en ${stats.filesChanged.length} archivos — revisar si es normalizacion accidental`,
      );
      riskScore += 10;
    }
  }

  // ---------- acciones de borrado explicito de archivos ----------

  if (input.actionType === "file_delete" || input.actionType === "file_overwrite_critical") {
    reasons.push(`Accion '${input.actionType}' siempre requiere confirmacion humana`);
    riskScore = Math.max(riskScore, 55);
    return { status: "needs_human", riskScore, reasons, suggestions };
  }

  // ---------- decision final ----------

  // Techo: si riskScore >= 30 escala a humano
  if (riskScore >= 30) {
    return { status: "needs_human", riskScore, reasons, suggestions };
  }

  // Todo limpio
  return {
    status: "approve",
    riskScore,
    reasons: reasons.length ? reasons : ["Sin señales de riesgo detectadas"],
    suggestions,
  };
}

/**
 * Genera un mensaje de Telegram listo para enviar cuando se escala a humano.
 * Markdown de Telegram (con escaping basico).
 */
export function formatReviewMessageForTelegram(
  reviewId: number,
  input: ReviewInput,
  result: ReviewResult,
): string {
  const escape = (s: string) =>
    s.replace(/[_*`[\]()~>#+=|{}.!-]/g, (m) => "\\" + m);

  const lines: string[] = [
    `*Revision pendiente #${reviewId}*`,
    `Agente: \`${escape(input.agentId)}\``,
    `Accion: \`${escape(input.actionType)}\``,
    `Resumen: ${escape(input.summary)}`,
    `Riesgo: *${result.riskScore}/100*`,
    ``,
    `*Razones:*`,
    ...result.reasons.map((r) => `\\- ${escape(r)}`),
  ];

  if (result.suggestions && result.suggestions.length) {
    lines.push(``, `*Sugerencias:*`);
    lines.push(...result.suggestions.map((s) => `\\- ${escape(s)}`));
  }

  lines.push(
    ``,
    `Responde con:`,
    `  \`/aprobar ${reviewId}\`  o  \`/denegar ${reviewId} razon\``,
  );

  return lines.join("\n");
}
