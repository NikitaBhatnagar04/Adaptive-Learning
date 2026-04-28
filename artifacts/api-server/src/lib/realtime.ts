import type { Response } from "express";

type Subscriber = {
  res: Response;
  topic: string;
};

const subscribers = new Set<Subscriber>();

export function subscribe(res: Response, topic: string) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  res.write(`event: ready\ndata: ${JSON.stringify({ topic })}\n\n`);

  const sub: Subscriber = { res, topic };
  subscribers.add(sub);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      // ignore
    }
  }, 25_000);

  res.on("close", () => {
    clearInterval(heartbeat);
    subscribers.delete(sub);
  });
}

export function broadcast(topic: string, event: string, payload: unknown) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const sub of subscribers) {
    if (sub.topic === topic || sub.topic === "*") {
      try {
        sub.res.write(data);
      } catch {
        subscribers.delete(sub);
      }
    }
  }
}
