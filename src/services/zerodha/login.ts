// zerodha/login.ts
import dotenv from "dotenv";
import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import { generateTOTP } from "./totp.js";
import { storeSession } from "./session.js";

dotenv.config();

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

export async function loginToKite() {
  try {
    const { otp: totp } = await generateTOTP(process.env.KITE_TOTP_SECRET!);
    console.log("Generated TOTP:", totp);

    // STEP 1 — GET login page to set cookies
    await client.get("https://kite.zerodha.com/", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    // STEP 2 — LOGIN
    // STEP 2 — LOGIN (FIXED ENDPOINT)
    const r1 = await client.post(
      "https://kite.zerodha.com/api/login",   // <-- FIXED
      new URLSearchParams({
        user_id: process.env.KITE_USER_ID!,
        password: process.env.KITE_PASSWORD!,
        type: "user_id"
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-kite-app-uuid": "616d4415-d4a8-4f23-8596-4fef0e081759",
          "x-kite-userid": process.env.KITE_USER_ID!,
          "x-kite-version": "3.0.0",
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://kite.zerodha.com/"
        }
      }
    );


    console.log("Login OK:", r1.data.data);

    const { user_id, request_id, twofa_type } = r1.data.data;

    // STEP 3 — SEND TOTP
    const r2 = await client.post(
      "https://kite.zerodha.com/api/twofa",
      new URLSearchParams({
        user_id,
        request_id,
        twofa_type,
        twofa_value: totp
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-kite-app-uuid": "616d4415-d4a8-4f23-8596-4fef0e081759",
          "x-kite-userid": process.env.KITE_USER_ID!,
          "x-kite-version": "3.0.0",
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://kite.zerodha.com/"
        }
      }
    );

    console.log("TOTP OK:", r2.data);

    let r3;
    try {
      r3 = await client.get(
        `https://kite.zerodha.com/connect/login?v=3&api_key=${process.env.KITE_API_KEY}`,
        {
          maxRedirects: 0,                                // block automatic redirect
          validateStatus: () => true                      // allow non-200 through
        }
      );
    } catch (err: any) {
      // Axios throws on 302 when maxRedirects=0
      r3 = err.response;
    }

    console.log("Status:", r3.status);
    console.log("Redirect location:", r3.headers.location);

    const redirect = r3.headers.location;

    await client.get(redirect)

    // // STEP 4 — Extract request_token (sess_id)
    // const redirectUrl = r2.data.data.redirect_url;
    // console.log("redirectUrl", redirectUrl);
    // const sessId = new URL(redirectUrl).searchParams.get("sess_id");

    // console.log("Request token:", sessId);

    // await storeSession(sessId!);

    // console.log("Session stored ✔");

  } catch (err) {
    console.error("Login failed:", err);
    throw err;
  }
}
