import { Router, type Request, type Response } from "express";
import { twilioClient, FROM_NUMBER } from "../lib/twilio.js";

const router = Router();

// E.164 format: + followed by 7-15 digits
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

const RETRY_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delayMs = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.code;
      if (attempt < retries && RETRY_STATUS_CODES.has(Number(status))) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

router.post("/whatsapp/send", async (req, res): Promise<void> => {
  const body = req.body as Record<string, string>;
  const to = body["to"]?.trim();
  const message = body["message"]?.trim();

  if (!to || !message) {
    res.status(400).json({
      error: "Both 'to' and 'message' are required.",
      details: {
        to: to ? "provided" : "missing",
        message: message ? "provided" : "missing",
      },
    });
    return;
  }

  // Strip whatsapp: prefix for validation, then re-add
  const rawNumber = to.startsWith("whatsapp:") ? to.slice(9) : to;

  if (!PHONE_REGEX.test(rawNumber)) {
    res.status(400).json({
      error:
        "Invalid phone number format. Use E.164 format (e.g. +201234567890).",
    });
    return;
  }

  const toFormatted = `whatsapp:${rawNumber}`;

  if (!twilioClient || !FROM_NUMBER) {
    req.log.error("Twilio client not initialised — check environment secrets");
    res.status(503).json({ error: "Twilio not configured on the server." });
    return;
  }

  try {
    const msg = await withRetry(() =>
      twilioClient!.messages.create({
        from: FROM_NUMBER,
        to: toFormatted,
        body: message,
      }),
    );

    req.log.info({ sid: msg.sid, to: toFormatted }, "WhatsApp message sent");
    res.json({ success: true, sid: msg.sid, to: toFormatted });
  } catch (err: any) {
    req.log.error({ err, to: toFormatted }, "Failed to send WhatsApp message");
    const statusCode =
      err?.status >= 400 && err?.status < 600 ? err.status : 502;
    res.status(statusCode).json({
      error: "Failed to send message via Twilio.",
      twilioCode: err?.code ?? null,
    });
  }
});

export default router;
