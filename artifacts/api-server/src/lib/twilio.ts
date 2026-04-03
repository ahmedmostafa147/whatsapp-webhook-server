import twilio from "twilio";
import { logger } from "./logger";

const accountSid = process.env["TWILIO_ACCOUNT_SID"];
const authToken = process.env["TWILIO_AUTH_TOKEN"];
const whatsappNumber = process.env["TWILIO_WHATSAPP_NUMBER"];

if (!accountSid || !authToken || !whatsappNumber) {
  logger.warn(
    "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_NUMBER is not set. Twilio features will be unavailable.",
  );
}

export const twilioClient =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

export const FROM_NUMBER = whatsappNumber ?? "";

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!authToken) return false;
  return twilio.validateRequest(authToken, signature, url, params);
}
