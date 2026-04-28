import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are Brightways Buddy, a friendly and patient AI learning assistant inside the Brightways
cognitive training app. The app helps kids and learners practice attention, memory, social
cognition, reading, and sensory regulation through short games.

Your job:
- Encourage learners and celebrate their effort.
- Explain ideas in short, simple, age-appropriate sentences (8-12 year-old reading level).
- When asked about a brain skill (focus, memory, social, reading, senses), give one or two
  practical tips and suggest a related game from the app when it fits.
- Keep replies concise (usually 1-3 short paragraphs or a small bulleted list).
- Use a warm, upbeat tone. Use emojis sparingly (at most one or two).
- Never give medical, diagnostic, or therapeutic advice. If asked, gently say you are not a
  doctor or therapist and suggest the learner talk to a trusted adult.
- If the user asks something off-topic from learning or the app, politely steer back to
  learning, brain skills, or what they could try next in the app.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

const MODEL = "gpt-5.4";
const MAX_RETRIES = 1;
const UPSTREAM_TIMEOUT_MS = 25_000;

async function callModel(messages: { role: string; content: string }[], parentSignal: AbortSignal) {
  const url = `${process.env.AI_INTEGRATIONS_OPENAI_BASE_URL}/chat/completions`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`,
  };
  const body = JSON.stringify({
    model: MODEL,
    messages,
    max_completion_tokens: 800,
  });

  let lastErr: { status: number; body: string } | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (parentSignal.aborted) throw new Error("aborted");

    const ctrl = new AbortController();
    const onParentAbort = () => ctrl.abort();
    parentSignal.addEventListener("abort", onParentAbort, { once: true });
    const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      const resp = await fetch(url, { method: "POST", headers, body, signal: ctrl.signal });

      if (resp.ok) {
        const data: any = await resp.json();
        const content: string = data?.choices?.[0]?.message?.content ?? "";
        return content;
      }

      const text = await resp.text().catch(() => "");
      lastErr = { status: resp.status, body: text };

      if (resp.status < 500 || attempt === MAX_RETRIES) break;
    } catch (e: any) {
      if (parentSignal.aborted) throw e;
      lastErr = { status: 0, body: e?.message ?? "fetch failed" };
      if (attempt === MAX_RETRIES) break;
    } finally {
      clearTimeout(timer);
      parentSignal.removeEventListener("abort", onParentAbort);
    }

    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }

  const message = `AI service error (${lastErr?.status ?? "timeout"})`;
  const err = new Error(message) as Error & { status?: number; upstreamBody?: string };
  err.status = lastErr?.status;
  err.upstreamBody = lastErr?.body;
  throw err;
}

router.post("/chat/stream", async (req: Request, res: Response): Promise<void> => {
  const messages = Array.isArray(req.body?.messages) ? (req.body.messages as ChatMessage[]) : [];

  const cleanedMessages = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    .slice(-20);

  if (cleanedMessages.length === 0 || cleanedMessages[cleanedMessages.length - 1]!.role !== "user") {
    res.status(400).json({ error: "messages must end with a user message" });
    return;
  }

  const controller = new AbortController();
  let closed = false;
  req.on("close", () => {
    closed = true;
    controller.abort();
  });

  try {
    const content = await callModel(
      [{ role: "system", content: SYSTEM_PROMPT }, ...cleanedMessages],
      controller.signal,
    );

    if (closed) return;

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof (res as any).flushHeaders === "function") (res as any).flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const chunkSize = 6;
    for (let i = 0; i < content.length; i += chunkSize) {
      if (closed) break;
      send("token", { delta: content.slice(i, i + chunkSize) });
      if (i % 60 === 0) await new Promise((r) => setTimeout(r, 8));
    }
    send("done", { content });
    res.end();
  } catch (err) {
    if (closed) return;
    const message = err instanceof Error ? err.message : "Unknown error";
    if (!res.headersSent) {
      res.status(502).json({ error: message });
    }
  }
});

export default router;
