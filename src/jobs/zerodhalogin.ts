import { loginToKite } from "../services/zerodha/login.js";

async function runZerodhaLoginJob() {
  console.log("Running zerodha login job...");
  await loginToKite();
}

// TODO: Uncomment when ready to schedule
// cron.schedule("55 8 * * 1-5", () => {
//   runZerodhaLoginJob().catch((err) =>
//     console.error("Cron job failed:", err.message)
//   );
// });

// Run immediately for testing
try {
  await runZerodhaLoginJob();
} catch (err) {
  console.error("Zerodha login job failed:", err instanceof Error ? err.message : String(err));
}