const SMSLog = require("../models/SMSLog");

/**
 * Send an SMS message notification
 * @param {string} toMobile - Recipient's mobile number
 * @param {string} messageContent - The body of the message
 */
const sendSMS = async (toMobile, messageContent) => {
  try {
    // 1. Beautiful ASCII Box Console Logging
    console.log("\n" + "=".repeat(60));
    console.log(`📱 [SIMULATED SMS MESSAGE NOTIFICATION]`);
    console.log(`TO:      ${toMobile}`);
    console.log(`MESSAGE: ${messageContent}`);
    console.log("=".repeat(60) + "\n");

    // 2. Save SMS log entry to MongoDB
    const log = new SMSLog({
      to: toMobile,
      message: messageContent
    });
    await log.save();

    // 3. Try to use Twilio if credentials exist in .env
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && fromPhone) {
      try {
        const twilio = require("twilio");
        const client = twilio(accountSid, authToken);
        await client.messages.create({
          body: messageContent,
          from: fromPhone,
          to: toMobile.startsWith("+") ? toMobile : `+91${toMobile}` // default to India code if not specified
        });
        console.log(`✅ [Twilio] SMS successfully sent to ${toMobile}`);
      } catch (twilioErr) {
        console.error(`❌ [Twilio Error] Failed to send SMS via Twilio:`, twilioErr.message);
      }
    }
  } catch (err) {
    console.error("Error in SMS service helper:", err);
  }
};

module.exports = { sendSMS };
