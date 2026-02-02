export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
};

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  prefix?: string;
  context?: Record<string, unknown>;
}

interface LoggerOptions {
  minLevel?: LogLevel;
  prefix?: string;
  emailOnCritical?: boolean;
  criticalEmailTo?: string;
}

// Anti-spam protection: track sent emails
const emailCache = new Map<string, number>();
const EMAIL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const MAX_EMAILS_PER_HOUR = 10;
let emailsSentThisHour = 0;
let hourResetTime = Date.now() + 60 * 60 * 1000;

function canSendEmail(messageHash: string): boolean {
  // Check if error emails are disabled
  if (process.env.DISABLE_ERROR_EMAILS === "true") {
    return false;
  }

  // Reset hourly counter if needed
  if (Date.now() > hourResetTime) {
    emailsSentThisHour = 0;
    hourResetTime = Date.now() + 60 * 60 * 1000;
  }

  // Check max emails per hour
  if (emailsSentThisHour >= MAX_EMAILS_PER_HOUR) {
    return false;
  }

  // Check cooldown for this specific message
  const lastSent = emailCache.get(messageHash);
  if (lastSent && Date.now() - lastSent < EMAIL_COOLDOWN_MS) {
    return false;
  }

  return true;
}

function markEmailSent(messageHash: string): void {
  emailCache.set(messageHash, Date.now());
  emailsSentThisHour++;

  // Clean up old entries
  for (const [hash, time] of emailCache.entries()) {
    if (Date.now() - time > EMAIL_COOLDOWN_MS) {
      emailCache.delete(hash);
    }
  }
}

function createMessageHash(message: string, code?: string): string {
  return `${code || "unknown"}-${message.slice(0, 50)}`;
}

class Logger {
  private minLevel: number;
  private prefix?: string;
  private emailOnCritical: boolean;
  private criticalEmailTo: string;

  constructor(options: LoggerOptions = {}) {
    this.minLevel = LOG_LEVELS[options.minLevel || "debug"];
    this.prefix = options.prefix;
    this.emailOnCritical = options.emailOnCritical ?? true;
    this.criticalEmailTo =
      options.criticalEmailTo || process.env.ADMIN_EMAIL || "admin@hordeagence.com";
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private formatEntry(entry: LogEntry): string {
    const parts = ["[Horde]"];

    if (entry.prefix || this.prefix) {
      parts.push(`[${entry.prefix || this.prefix}]`);
    }

    parts.push(`[${entry.level.toUpperCase()}]`);
    parts.push(entry.timestamp);
    parts.push("-");
    parts.push(entry.message);

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context));
    }

    return parts.join(" ");
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      prefix: this.prefix,
      context,
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case "debug":
        console.debug(formatted);
        break;
      case "info":
        console.log(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "error":
      case "critical":
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  /**
   * Log critical error and send email notification.
   * Use for errors that require immediate attention.
   */
  critical(message: string, context?: Record<string, unknown>): void {
    this.log("critical", message, context);

    if (!this.emailOnCritical) return;

    const hash = createMessageHash(message, context?.code as string | undefined);
    if (!canSendEmail(hash)) {
      console.log("[Horde] [Logger] Email notification skipped (rate limited or cooldown)");
      return;
    }

    // Send email asynchronously without blocking
    this.sendCriticalEmail(message, context)
      .then(() => markEmailSent(hash))
      .catch((err) => console.error("[Horde] [Logger] Failed to send critical error email:", err));
  }

  private async sendCriticalEmail(
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    // Dynamic imports to avoid initialization issues in tests
    const { criticalErrorEmail } = await import("@/lib/email/templates/critical-error");
    const { sendEmail } = await import("@/lib/email/send");

    const html = criticalErrorEmail({
      message,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId as string | undefined,
      code: context?.code as string | undefined,
      stack: context?.stack as string | undefined,
      url: context?.url as string | undefined,
      userAgent: context?.userAgent as string | undefined,
    });

    await sendEmail({
      to: this.criticalEmailTo,
      subject: `[CRITICAL] Erreur sur Horde Portal`,
      html,
    });
  }
}

// Default logger instance with email notifications enabled
export const logger = new Logger({ emailOnCritical: true });

/**
 * Create a logger with a specific prefix for module-level logging.
 */
export function createLogger(prefix: string, options?: Omit<LoggerOptions, "prefix">): Logger {
  return new Logger({ ...options, prefix });
}

export { Logger };
