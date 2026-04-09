import { Router, type Request, type Response } from "express";
import { twilioClient, FROM_NUMBER } from "../lib/twilio.js";

const router = Router();

router.post("/whatsapp/send", async (req, res): Promise<void> => {
  const body = req.body as Record<string, string>;
  const to = body["to"]?.trim();
  const message = body["message"]?.trim();

  if (!to || !message) {
    res.status(400).json({ error: "Both 'to' and 'message' are required." });
    return;
  }

  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  if (!twilioClient || !FROM_NUMBER) {
    req.log.error("Twilio client not initialised — check environment secrets");
    res.status(503).json({ error: "Twilio not configured." });
    return;
  }

  try {
    const msg = await twilioClient.messages.create({
      from: FROM_NUMBER,
      to: toFormatted,
      body: message,
    });

    req.log.info({ sid: msg.sid, to: toFormatted }, "WhatsApp message sent");
    res.json({ success: true, sid: msg.sid, to: toFormatted });
  } catch (err) {
    req.log.error({ err, to: toFormatted }, "Failed to send WhatsApp message");
    res.status(502).json({ error: "Failed to send message via Twilio." });
  }
});

export default router;
