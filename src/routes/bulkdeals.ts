import express from "express";
import { fetchBulkDeals } from "../services/largeDeals.js";
import { transformBulkDeals } from "../utils/transformBulkDeals.js";
import { insertMany, getDealsByDate } from "../database/dealsRepo.js";
import type { DealEntry } from "../types/nseDeals.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const data = await fetchBulkDeals();
    const transformedData = transformBulkDeals(data);
    const existing = getDealsByDate(data.as_on_date);
  
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
      console.log(`💾 Inserted ${newDeals.length} new bulk deals.`);
    } else {
      console.log("No new bulk deals found.");
    }
  
    const response = {
      data: transformedData,
      as_on_date: data.as_on_date,
      BULK_DEALS: data.BULK_DEALS,
      SHORT_DEALS: data.SHORT_DEALS,
      BLOCK_DEALS: data.BLOCK_DEALS,
    }
    res.json(response);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bulk deals" });
  }
});

export default router;