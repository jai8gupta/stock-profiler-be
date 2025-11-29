import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bulkDealsRouter from "./routes/bulkdeals.js";
import registerPushTokenRouter from "./routes/registerPushToken.js";
import requestTokenRouter from "./routes/requestToken.js";
import "./jobs/bulkDealsJob.js";

dotenv.config();
const app = express();
app.use(cors({
    origin: "*"
}));
app.use(express.json());

app.use("/api/registerPushToken", registerPushTokenRouter);
app.use("/api/bulkdeals", bulkDealsRouter);
app.use("/", requestTokenRouter)

app.get("/", (_, res) => res.json({message:"Stock Profiler API is running 🚀"}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));