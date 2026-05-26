import Twilio from "twilio";
import { ENV_VALUE } from "../utils/env";

const client = Twilio(
  ENV_VALUE.TWILIO.TWILIO_ACCOUNT_SID,
  ENV_VALUE.TWILIO.TWILIO_AUTH_TOKEN,
);

export async function sendSMS(to: string, body: string) {
  try {
    const message = await client.messages.create({
      body,
      from: ENV_VALUE.TWILIO.TWILIO_PHONE_NUMBER,
      to, // recipient phone number
    });
    console.log("SMS sent:", message.sid);
    return message;
  } catch (err) {
    console.error("Twilio SMS error:", err);
    throw err;
  }
}
