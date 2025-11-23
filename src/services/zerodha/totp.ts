import { totp } from "otplib";

export function generateTOTP(secret: string) {
  return totp.generate(secret);
}
