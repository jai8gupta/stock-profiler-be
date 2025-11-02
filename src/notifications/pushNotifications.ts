import { Expo } from "expo-server-sdk";

const expo = new Expo();

export async function sendPushNotification(message: {
    title: string;
    body: string;
    data?: any;
    to?: string[]; // optional: multiple tokens
  }) {
    try {
        // Fetch tokens from DB (or receive via message.to)
        // Example: here we assume a single token from env or DB
        const tokens =
          message.to && message.to.length
            ? message.to
            : process.env.EXPO_PUSH_TOKENS?.split(",") ?? [];
    
        if (!tokens.length) {
          console.warn("⚠️ No Expo tokens registered. Skipping notification.");
          return;
        }
    
        // Validate tokens
        const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
    
        const messages = validTokens.map((token) => ({
          to: token,
          sound: "default",
          title: message.title,
          body: message.body,
          data: message.data ?? {},
        }));
    
        // Chunk & send
        const chunks = expo.chunkPushNotifications(messages);
        const tickets: any[] = [];
    
        for (const chunk of chunks) {
          try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
          } catch (error) {
            console.error("❌ Push send failed:", error);
          }
        }
    
        console.log("📨 Notification sent:", tickets.length, "tickets");
      } catch (err: any) {
        console.error("Push notification error:", err.message);
      }
}