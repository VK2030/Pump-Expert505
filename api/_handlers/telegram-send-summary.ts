export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { summary } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({ error: "Telegram configuration is missing" });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: summary,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(errorData.description || "Failed to send message to Telegram");
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Telegram error:", error);
    res.status(500).json({ error: error.message });
  }
}
