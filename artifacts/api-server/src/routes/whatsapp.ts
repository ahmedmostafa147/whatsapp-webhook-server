import { Router, type IRouter } from "express";
import twilio from "twilio";
import { twilioClient, FROM_NUMBER, validateTwilioSignature } from "../lib/twilio";

const router: IRouter = Router();

router.post("/whatsapp/webhook", async (req, res): Promise<void> => {
  const authToken = process.env["TWILIO_AUTH_TOKEN"];

  if (authToken) {
    const signature = (req.headers["x-twilio-signature"] as string) ?? "";
    const protocol = req.headers["x-forwarded-proto"] ?? req.protocol;
    const host = req.headers["host"];
    const url = `${protocol}://${host}${req.originalUrl}`;

    const isValid = validateTwilioSignature(
      signature,
      url,
      req.body as Record<string, string>,
    );

    if (!isValid) {
      req.log.warn({ url }, "Invalid Twilio signature — request rejected");
      res.status(403).send("Forbidden");
      return;
    }
  } else {
    req.log.warn("TWILIO_AUTH_TOKEN not set — skipping signature validation");
  }

  const body = req.body as Record<string, string>;
  const from: string = body["From"] ?? "";
  const messageBody: string = body["Body"] ?? "";
  const messageSid: string = body["MessageSid"] ?? "";

  req.log.info(
    { from, messageSid, body: messageBody },
    "Received WhatsApp message",
  );

  const replyText = `Echo: ${messageBody}`;

  if (twilioClient && FROM_NUMBER) {
    try {
      await twilioClient.messages.create({
        from: FROM_NUMBER,
        to: from,
        body: replyText,
      });
      req.log.info({ to: from }, "Reply sent via Twilio");
    } catch (err) {
      req.log.error({ err, to: from }, "Failed to send Twilio reply");
    }
  } else {
    req.log.warn("Twilio client not initialised — reply not sent");
  }

  const twiml = new twilio.twiml.MessagingResponse();
  res.type("text/xml").send(twiml.toString());
});

router.get("/whatsapp/webhook", (_req, res): void => {
  res.status(200).send("WhatsApp webhook is active");
});

export default router;
