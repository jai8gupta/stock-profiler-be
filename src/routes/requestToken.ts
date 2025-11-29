import express from "express";
import { storeSession } from "../services/zerodha/session.js";

const router = express.Router();

router.get("/", async (req, res) => {
    console.log(req.query);
    const requestToken = req.query?.request_token as string;
    console.log("request_token in requestToken route", requestToken);
    if (!requestToken) {
        return res.status(400).json({status:400, message:"Request token is required"});
    }
    try {
        await storeSession(requestToken);
    
        console.log("Session stored ✔");
        res.json({status:200, message:"successFully Registered Request Token"});
        return;
        
    } catch (error) {
        console.error("Error in requestToken route", error);
        res.status(500).json({status:500, message:"Internal server error"});
        return;
    }
});

export default router;