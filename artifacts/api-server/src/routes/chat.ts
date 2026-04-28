import { Router } from "express";

const router = Router();

const SYSTEM_PROMPT = `You are Brightways Buddy, a friendly AI for kids.
Keep answers short, simple, and helpful. Suggest games when useful.`;

router.post("/chat/stream", async (req, res) => {
  const messages = req.body?.messages || [];
  const userMessage = messages[messages.length - 1]?.content || "";

  console.log("GEMINI KEY:", process.env.GEMINI_API_KEY); // 🔍 DEBUG

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`event: token\ndata: ${JSON.stringify({ delta: "🤖 " })}\n\n`);

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY || "",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nUser: ${userMessage}`,
                },
              ],
            },
          ],
        }),
      }
    );

    // 🔥 CHECK RESPONSE STATUS
    if (!response.ok) {
      const text = await response.text();
      console.error("GEMINI HTTP ERROR:", text);
      throw new Error("Gemini request failed");
    }

    const data = await response.json();

    console.log("GEMINI RESPONSE:", JSON.stringify(data, null, 2));

    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Empty Gemini response");
    }

    for (let i = 0; i < content.length; i += 10) {
      res.write(
        `event: token\ndata: ${JSON.stringify({
          delta: content.slice(i, i + 10),
        })}\n\n`
      );
      await new Promise((r) => setTimeout(r, 5));
    }

    res.write(`event: done\ndata: ${JSON.stringify({ content })}\n\n`);
    res.end();

  } catch (err: any) {
    console.error("GEMINI ERROR:", err.message);

    res.write(
      `event: token\ndata: ${JSON.stringify({
        delta: "⚠️ AI not working properly. Check API key/config.",
      })}\n\n`
    );

    res.write(`event: done\ndata: ${JSON.stringify({})}\n\n`);
    res.end();
  }
});

export default router;