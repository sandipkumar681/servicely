export const ENV_VALUE = {
  PORT: Number(process.env.PORT) || 4567,
  MONGO_URI: process.env.MONGO_URI!,
  CORS_ORIGIN: process.env.CORS_ORIGIN!,
  JWT: {
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY!,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY!,
  },
  COOKIE: {
    HTTPONLY: process.env.HTTPONLY!,
    PARTITIONED: process.env.PARTITIONED!,
    SAMESITE: process.env.SAMESITE!,
    SECURE: process.env.SECURE!,
  },
  EMAIL: {
    GMAIL_PORT: process.env.GMAIL_PORT || 456,
    OTP_EXPIRY_TIME: process.env.OTP_EXPIRY_TIME!,
    SENDER_GMAIL_ADDRESS: process.env.SENDER_GMAIL_ADDRESS!,
    SENDER_GMAIL_PASSWORD: process.env.SENDER_GMAIL_PASSWORD!,
  },
  B2: {
    B2_APPLICATION_KEY_ID: process.env.B2_APPLICATION_KEY_ID!,
    B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY!,
    B2_BUCKET_NAME: process.env.B2_BUCKET_NAME!,
    B2_BUCKET_ID: process.env.B2_BUCKET_ID!,
  },
  TWILIO: {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER!,
  },
  LOGS: {
    NODE_ENV: process.env.NODE_ENV!,
  },
};
