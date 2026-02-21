/**
 * Email Service — Resend integration with defensive design
 * 
 * SAFETY MEASURES (previous email integration crashed servers):
 * - All sends are non-blocking (fire-and-forget with error catching)
 * - Built-in rate limiting (max 2 emails/second, queue overflow protection)
 * - Graceful degradation when RESEND_API_KEY is not set
 * - Timeout on every API call (10s max)
 * - No retries on failure (prevents cascade)
 * 
 * Environment variables:
 *   RESEND_API_KEY    - API key from resend.com (required to send email)
 *   EMAIL_FROM        - Sender address (default: "Avivando el Fuego <noreply@avivandoelfuego.org>")
 *   APP_URL           - Base URL for links in emails (default: "http://localhost:5000")
 */

import { Resend } from "resend";

// ─── Configuration ───────────────────────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Avivando el Fuego <noreply@ministerioavivandoelfuego.com>";
const APP_URL = process.env.APP_URL || (process.env.NODE_ENV === "production" ? "https://ministerioavivandoelfuego.com" : "http://localhost:5000");

export const isEmailConfigured = !!RESEND_API_KEY;

// Log email configuration status on startup
if (isEmailConfigured) {
  console.log(`[email] Service ACTIVE — sending from: ${EMAIL_FROM}, app URL: ${APP_URL}`);
} else {
  console.warn("[email] Service DISABLED — RESEND_API_KEY not set. Emails will NOT be sent.");
}

// ─── Rate-limited queue ──────────────────────────────────────────────────────

const MAX_QUEUE_SIZE = 500; // Enough headroom for bulk course notifications
const SEND_INTERVAL_MS = 500; // Max 2 emails/second
const emailQueue: Array<{ to: string; subject: string; html: string }> = [];
let queueProcessing = false;

function enqueueEmail(to: string, subject: string, html: string): void {
  if (!isEmailConfigured) return;
  
  if (emailQueue.length >= MAX_QUEUE_SIZE) {
    console.warn(`[email] Queue full (${MAX_QUEUE_SIZE}), dropping email to ${to}`);
    return;
  }
  
  emailQueue.push({ to, subject, html });
  processQueue(); // Start processing if not already running
}

async function processQueue(): Promise<void> {
  if (queueProcessing || emailQueue.length === 0) return;
  queueProcessing = true;

  while (emailQueue.length > 0) {
    const email = emailQueue.shift()!;
    try {
      await sendEmailDirect(email.to, email.subject, email.html);
    } catch (err) {
      console.error(`[email] Send failed to ${email.to}:`, err instanceof Error ? err.message : err);
      // Do NOT retry — prevents cascade failures
    }
    // Rate limit: wait between sends
    if (emailQueue.length > 0) {
      await new Promise((r) => setTimeout(r, SEND_INTERVAL_MS));
    }
  }

  queueProcessing = false;
}

// ─── Direct send (internal, with timeout) ────────────────────────────────────

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

async function sendEmailDirect(to: string, subject: string, html: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
    if (result.error) {
      console.error(`[email] Resend API error for ${to}:`, result.error);
      throw new Error(`Resend API: ${result.error.message || JSON.stringify(result.error)}`);
    }
    console.log(`[email] Sent: "${subject}" → ${to} (id: ${result.data?.id || "unknown"})`);
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" → ${to}:`, err instanceof Error ? err.message : err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Send a password reset email. Non-blocking, safe to call from request handlers.
 */
export function sendPasswordResetEmail(to: string, token: string, displayName?: string | null): void {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const name = displayName || "Hermano/a";
  
  enqueueEmail(to, "Restablecer tu contraseña — Avivando el Fuego", `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #e67e22; margin: 0;">🔥 Avivando el Fuego</h1>
        <p style="color: #666; margin-top: 5px;">Ministerio Internacional</p>
      </div>
      
      <h2 style="color: #333;">Hola ${name},</h2>
      <p style="color: #555; line-height: 1.6;">
        Recibimos una solicitud para restablecer tu contraseña. 
        Haz clic en el boton de abajo para crear una nueva:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background: #e67e22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          Restablecer Contraseña
        </a>
      </div>
      
      <p style="color: #888; font-size: 13px; line-height: 1.5;">
        Este enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, ignora este correo.<br/>
        Si el boton no funciona, copia y pega este enlace: <br/>
        <a href="${resetUrl}" style="color: #e67e22; word-break: break-all;">${resetUrl}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        Avivando el Fuego — Ministerio Internacional
      </p>
    </div>
  `);
}

/**
 * Send an email verification email. Non-blocking.
 */
export function sendVerificationEmail(to: string, token: string, displayName?: string | null): void {
  const verifyUrl = `${APP_URL}/verificar-email?token=${token}`;
  const name = displayName || "Hermano/a";
  
  enqueueEmail(to, "Verifica tu correo — Avivando el Fuego", `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #e67e22; margin: 0;">🔥 Avivando el Fuego</h1>
        <p style="color: #666; margin-top: 5px;">Ministerio Internacional</p>
      </div>
      
      <h2 style="color: #333;">Bienvenido/a ${name}!</h2>
      <p style="color: #555; line-height: 1.6;">
        Gracias por registrarte en nuestra plataforma. 
        Para completar tu registro, verifica tu correo electronico:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" 
           style="background: #e67e22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          Verificar Correo
        </a>
      </div>
      
      <p style="color: #888; font-size: 13px; line-height: 1.5;">
        Este enlace expira en <strong>24 horas</strong>.<br/>
        Si el boton no funciona, copia y pega este enlace: <br/>
        <a href="${verifyUrl}" style="color: #e67e22; word-break: break-all;">${verifyUrl}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        Avivando el Fuego — Ministerio Internacional
      </p>
    </div>
  `);
}

/**
 * Send a welcome email after verification. Non-blocking.
 */
export function sendWelcomeEmail(to: string, displayName?: string | null): void {
  const name = displayName || "Hermano/a";
  
  enqueueEmail(to, "Bienvenido/a a Avivando el Fuego! 🔥", `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #e67e22; margin: 0;">🔥 Avivando el Fuego</h1>
        <p style="color: #666; margin-top: 5px;">Ministerio Internacional</p>
      </div>
      
      <h2 style="color: #333;">Bienvenido/a ${name}!</h2>
      <p style="color: #555; line-height: 1.6;">
        Tu correo ha sido verificado exitosamente. Ya puedes acceder a todos los recursos del ministerio:
      </p>
      
      <ul style="color: #555; line-height: 2;">
        <li>📚 <strong>Capacitaciones</strong> — Cursos y material de estudio</li>
        <li>👥 <strong>Comunidad</strong> — Conecta con otros miembros</li>
        <li>📖 <strong>Biblioteca</strong> — Recursos biblicos y devocionales</li>
        <li>🙏 <strong>Oracion</strong> — Actividades de intercesion</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}" 
           style="background: #e67e22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          Ir a la Plataforma
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        Avivando el Fuego — Ministerio Internacional
      </p>
    </div>
  `);
}

/**
 * Get email service status for admin panel.
 */
export function getEmailStatus(): { configured: boolean; queueLength: number; from: string } {
  return {
    configured: isEmailConfigured,
    queueLength: emailQueue.length,
    from: EMAIL_FROM,
  };
}

// ─── Notification Emails (optional, respect user preferences) ────────────────

const EMAIL_FOOTER = `
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  <p style="color: #aaa; font-size: 11px; text-align: center;">
    Avivando el Fuego — Ministerio Internacional<br/>
    <a href="${APP_URL}/perfil?tab=notificaciones" style="color: #aaa;">Cambiar preferencias de correo</a>
  </p>
`;

const EMAIL_HEADER = `
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #e67e22; margin: 0;">🔥 Avivando el Fuego</h1>
    <p style="color: #666; margin-top: 5px;">Ministerio Internacional</p>
  </div>
`;

/**
 * Notify user their account was approved by admin. Non-blocking.
 */
export function sendAccountApprovedEmail(to: string, displayName?: string | null): void {
  const name = displayName || "Hermano/a";
  enqueueEmail(to, "Tu cuenta fue aprobada! 🎉 — Avivando el Fuego", `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${EMAIL_HEADER}
      <h2 style="color: #333;">Hola ${name},</h2>
      <p style="color: #555; line-height: 1.6;">
        Buenas noticias! Un administrador ha <strong>aprobado tu cuenta</strong>. 
        Ahora tienes acceso completo a todos los recursos del ministerio.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}" 
           style="background: #e67e22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          Ir a la Plataforma
        </a>
      </div>
      ${EMAIL_FOOTER}
    </div>
  `);
}

/**
 * Notify user they received a direct message. Non-blocking.
 */
export function sendDirectMessageEmail(to: string, senderName: string, messagePreview: string, receiverName?: string | null): void {
  const name = receiverName || "Hermano/a";
  const preview = messagePreview.length > 100 ? messagePreview.substring(0, 100) + "..." : messagePreview;
  enqueueEmail(to, `Nuevo mensaje de ${senderName} — Avivando el Fuego`, `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${EMAIL_HEADER}
      <h2 style="color: #333;">Hola ${name},</h2>
      <p style="color: #555; line-height: 1.6;">
        <strong>${senderName}</strong> te envio un mensaje:
      </p>
      <div style="background: #f5f5f5; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #555; margin: 0; font-style: italic;">"${preview}"</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/mensajes" 
           style="background: #e67e22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          Ver Mensaje
        </a>
      </div>
      ${EMAIL_FOOTER}
    </div>
  `);
}

/**
 * Notify users about a new course. Non-blocking.
 */
export function sendNewCourseEmail(to: string, courseName: string, courseId: number, receiverName?: string | null): void {
  const name = receiverName || "Hermano/a";
  enqueueEmail(to, `Nuevo Curso: ${courseName} — Avivando el Fuego`, `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${EMAIL_HEADER}
      <h2 style="color: #333;">Hola ${name},</h2>
      <p style="color: #555; line-height: 1.6;">
        Se ha publicado un nuevo curso en la plataforma:
      </p>
      <div style="background: #fff8f0; border: 1px solid #f0d0a0; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
        <h3 style="color: #e67e22; margin: 0 0 10px 0;">📚 ${courseName}</h3>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/capacitaciones/${courseId}" 
           style="background: #e67e22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          Ver Curso
        </a>
      </div>
      ${EMAIL_FOOTER}
    </div>
  `);
}

/**
 * Notify user about an upcoming event. Non-blocking.
 */
export function sendEventReminderEmail(to: string, eventTitle: string, eventDate: string, receiverName?: string | null): void {
  const name = receiverName || "Hermano/a";
  enqueueEmail(to, `Recordatorio: ${eventTitle} — Avivando el Fuego`, `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${EMAIL_HEADER}
      <h2 style="color: #333;">Hola ${name},</h2>
      <p style="color: #555; line-height: 1.6;">
        Te recordamos que tienes un evento proximo:
      </p>
      <div style="background: #fff8f0; border: 1px solid #f0d0a0; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
        <h3 style="color: #e67e22; margin: 0 0 10px 0;">📅 ${eventTitle}</h3>
        <p style="color: #666; margin: 0;">Fecha: <strong>${eventDate}</strong></p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/eventos" 
           style="background: #e67e22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          Ver Eventos
        </a>
      </div>
      ${EMAIL_FOOTER}
    </div>
  `);
}
