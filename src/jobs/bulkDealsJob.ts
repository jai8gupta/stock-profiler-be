import cron from "node-cron";
import { fetchBulkDeals } from "../services/largeDeals.js";
import { transformBulkDeals } from "../utils/transformBulkDeals.js";
import { insertMany, getDealsByDate } from "../database/dealsRepo.js";
import type { DealEntry } from "../types/nseDeals.js";
import { sendPushNotification } from "../notifications/pushNotifications.js";



async function runBulkDealsJob() {
    console.log("Running bulk deals job...");
    const data = await fetchBulkDeals();
    const transformedData = transformBulkDeals(data);
    const existing = getDealsByDate(data.as_on_date);

    // Compare current vs stored
    const newDeals = transformedData.filter(
        (d) =>
          !existing.some(
            (e) => {
              const deal = e as DealEntry;
              return (
                deal.symbol === d.symbol &&
                deal.clientName === d.clientName &&
                deal.buySell === d.buySell &&
                Number(deal.qty) === Number(d.qty)
              );
            }
          )
      );

    if (newDeals.length > 0) {
        insertMany(newDeals);
        console.log(`✅ ${newDeals.length} new bulk deals added.`);

        // Optional push notification
        for (const deal of newDeals) {
        await sendPushNotification({
            title: "New Bulk Deal 🚀",
            body: `${deal.symbol} | ${deal.buySell} by ${deal.clientName} @ ₹${deal.watp}`,
            data: deal,
        });
        }
    } else {
        console.log("No new bulk deals found.");
    }
}

cron.schedule("30 9-15 * * 1-5", () => {
    runBulkDealsJob().catch((err) =>
      console.error("Cron job failed:", err.message)
    );
  });
  