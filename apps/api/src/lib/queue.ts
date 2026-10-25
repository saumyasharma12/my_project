import { Queue, Worker } from "bullmq";
import { config } from "../config/index.js";
import { logger } from "./logger.js";
import { prisma } from "@commerce/db";

export interface EmailJobData {
  type: "ORDER_CONFIRMATION" | "ORDER_STATUS_UPDATE" | "LOW_STOCK_ALERT";
  to: string;
  subject: string;
  payload: Record<string, unknown>;
}

export interface AuditJobData {
  userId?: string | null | undefined;
  adminName?: string | null | undefined;
  action: string;
  entity: string;
  entityId?: string | null | undefined;
  details?: string | null | undefined;
  ipAddress?: string | null | undefined;
}

const connection = {
  host: new URL(config.redisUrl).hostname || "127.0.0.1",
  port: Number(new URL(config.redisUrl).port || 6379),
  maxRetriesPerRequest: null,
};

let emailQueue: Queue<EmailJobData> | null = null;
let auditQueue: Queue<AuditJobData> | null = null;
let emailWorker: Worker<EmailJobData> | null = null;
let auditWorker: Worker<AuditJobData> | null = null;

try {
  emailQueue = new Queue<EmailJobData>("email-notifications", { connection });
  auditQueue = new Queue<AuditJobData>("audit-logs", { connection });

  emailWorker = new Worker<EmailJobData>(
    "email-notifications",
    async (job) => {
      logger.info(`[BullMQ Worker] Processing email notification: ${job.name}`, {
        type: job.data.type,
        to: job.data.to,
        subject: job.data.subject,
      });

      // Production email transport simulation / logging
      // In production, this can call SendGrid, Resend, or AWS SES
      return { sent: true, recipient: job.data.to, timestamp: new Date().toISOString() };
    },
    { connection },
  );

  emailWorker.on("completed", (job) => {
    logger.info(`[BullMQ Worker] Email job ${job.id} completed successfully`);
  });

  emailWorker.on("failed", (job, err) => {
    logger.error(`[BullMQ Worker] Email job ${job?.id} failed`, err);
  });

  auditWorker = new Worker<AuditJobData>(
    "audit-logs",
    async (job) => {
      try {
        await prisma.auditLog.create({
          data: {
            userId: job.data.userId ?? null,
            adminName: job.data.adminName ?? null,
            action: job.data.action,
            entity: job.data.entity,
            entityId: job.data.entityId ?? null,
            details: job.data.details ?? null,
            ipAddress: job.data.ipAddress ?? null,
          },
        });
        logger.info(`[BullMQ Worker] Audit log saved: ${job.data.action} on ${job.data.entity}`);
      } catch (err) {
        logger.error("[BullMQ Worker] Failed to write audit log to database", err);
      }
    },
    { connection },
  );

  auditWorker.on("failed", (job, err) => {
    logger.error(`[BullMQ Worker] Audit job ${job?.id} failed`, err);
  });
} catch (err) {
  logger.warn("Failed to initialize BullMQ, jobs will run synchronously fallback", {
    error: err instanceof Error ? err.message : String(err),
  });
}

export async function enqueueEmail(data: EmailJobData): Promise<void> {
  try {
    if (emailQueue) {
      await emailQueue.add(data.type, data, {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      });
      return;
    }
  } catch (err) {
    logger.warn("BullMQ enqueueEmail failed, falling back to synchronous handler", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Fallback
  logger.info(`[Sync Fallback] Dispatched notification: ${data.subject} to ${data.to}`);
}

export async function recordAuditLog(data: AuditJobData): Promise<void> {
  try {
    if (auditQueue) {
      await auditQueue.add("log-event", data, { attempts: 2 });
      return;
    }
  } catch (err) {
    logger.warn("BullMQ recordAuditLog failed, saving directly to DB", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Fallback to direct DB write
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId ?? null,
        adminName: data.adminName ?? null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId ?? null,
        details: data.details ?? null,
        ipAddress: data.ipAddress ?? null,
      },
    });
  } catch (err) {
    logger.error("Failed to write audit log directly to DB", err);
  }
}
