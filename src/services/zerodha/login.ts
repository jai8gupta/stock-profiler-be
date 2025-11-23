// zerodha/login.js
import dotenv from "dotenv";
import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import { generateTOTP } from "./totp.js";
import { storeSession } from "./session.js";


dotenv.config();

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

async function loginToKite() {
  const totp = generateTOTP(process.env.KITE_TOTP_SECRET as string);
  console.log("Generated TOTP:", totp);

  // 1. GET login page (sets cookies)
  await client.get("https://kite.zerodha.com");

  // 2. POST username + password
  const r1 = await client.post(
    "https://kite.zerodha.com/api/login",
    {
      user_id: process.env.KITE_USER_ID,
      password: process.env.KITE_PASSWORD
    }
  );

  if (r1.data.status !== "success")
    throw new Error("Login step failed");

  // 3. POST TOTP (2FA)
  const r2 = await client.post(
    "https://kite.zerodha.com/api/twofa",
    {
      user_id: process.env.KITE_USER_ID,
      request_id: r1.data.data.request_id,
      twofa_value: totp,
      twofa_type: "totp"
    }
  );

  if (r2.data.status !== "success")
    throw new Error("TOTP step failed");

  // 4. Zerodha now redirects to a URL with ?request_token=XXXX
  const redirectUrl = r2.data.data.redirect_url;

  const urlObj = new URL(redirectUrl);
  const request_token = urlObj.searchParams.get("request_token");

  if (!request_token)
    throw new Error("Failed to extract request_token");

  console.log("Got request_token:", request_token);

  // 5. Exchange for access_token
  await storeSession(request_token);
}

export { loginToKite };