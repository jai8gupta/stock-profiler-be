import { TOTP } from "totp-generator"

export async function generateTOTP(secret: string) {
  return await TOTP.generate(secret);
}

// generateTOTP("3BLELFRGWLNSD6EKLOCXWZHAPGXXGNEC").then((res) => console.log(res))