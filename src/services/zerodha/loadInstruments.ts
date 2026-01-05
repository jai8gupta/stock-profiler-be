// src/kite/loadInstruments.ts
import axios from "axios";
import fs from "fs";
import csvParser from "csv-parser";

export async function loadInstruments(): Promise<any[]> {
  const response = await axios.get("https://api.kite.trade/instruments", {
    responseType: "stream"
  });

  const instruments: any[] = [];

  return new Promise((resolve) => {
    response.data
      .pipe(csvParser())
      .on("data", (row: any) => {
        if (row.exchange === "NSE" && row.instrument_type === "EQ") {
          instruments.push({
            token: parseInt(row.instrument_token),
            tradingsymbol: row.tradingsymbol,
            name: row.name
          });
        }
      })
      .on("end", () => {
        console.log("Filtered instruments:", instruments.length);
        fs.writeFileSync("./instruments.json", JSON.stringify(instruments, null, 2));
        resolve(instruments);
      });
  });
}
loadInstruments()