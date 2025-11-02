import type { DealEntry, NseLargeDealResponse } from "../types/nseDeals.ts";

export const transformBulkDeals = (data: NseLargeDealResponse) => {
    if (!data) return [];
    const bulkDeals = data?.BULK_DEALS_DATA;
    if (!bulkDeals) return [];
    // since I am only interested in bulkDeals that only have buySell as BUY, I will filter out the deals that have buySell as SELL
    const stockMapWithTransactionsBuy = new Map<string, DealEntry[]>();
    const stockMapWithTransactionsSell = new Map<string, DealEntry[]>();

    bulkDeals?.map((deal) => {
        if(deal.buySell === "BUY"){
            if (stockMapWithTransactionsBuy.has(deal?.symbol)) {
                stockMapWithTransactionsBuy.get(deal?.symbol)?.push(deal);
            }else {
                stockMapWithTransactionsBuy.set(deal.symbol, [deal]);
            }
        }else {
            if (stockMapWithTransactionsSell.has(deal?.symbol)) {
                stockMapWithTransactionsSell.get(deal?.symbol)?.push(deal);
            }else {
                stockMapWithTransactionsSell.set(deal.symbol, [deal]);
            }
        }
    })


    const filteredBulkDealsData : DealEntry[]  = [];

    for(const [key, value] of stockMapWithTransactionsBuy ){
        if(stockMapWithTransactionsSell.has(key)) continue;
        filteredBulkDealsData.push(...value);
    }

    return filteredBulkDealsData;
};

