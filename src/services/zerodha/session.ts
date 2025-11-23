
import dotenv from "dotenv";    
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { KiteConnect } from "kiteconnect";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKENS_FILE = path.join(__dirname, "tokens.json");

async function storeSession(request_token: string) {
  const kc = new KiteConnect({
    api_key: process.env.KITE_API_KEY as string
  });

  const session = await kc.generateSession(
    request_token,
    process.env.KITE_API_SECRET as string
  );

  fs.writeFileSync(TOKENS_FILE, JSON.stringify({
    access_token: session.access_token,
    public_token: session.public_token,
    created_at: new Date().toISOString()
  }, null, 2));

  console.log("✔ Access token saved to tokens.json");
}

function getAccessToken() {
  const file = fs.readFileSync(TOKENS_FILE, "utf8");
  return JSON.parse(file).access_token;
}

export { storeSession, getAccessToken };
