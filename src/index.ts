import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bulkDealsRouter from "./routes/bulkdeals.ts";
import registerPushTokenRouter from "./routes/registerPushToken.ts";
import "./jobs/bulkDealsJob.ts";

dotenv.config();
const app = express();
app.use(cors({
    origin: "*"
}));
app.use(express.json());

app.use("/api/registerPushToken", registerPushTokenRouter);
app.use("/api/bulkdeals", bulkDealsRouter);

app.get("/", (_, res) => res.json({message:"Stock Profiler API is running 🚀"}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));