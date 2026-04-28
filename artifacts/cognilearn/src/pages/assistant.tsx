import { useEffect, useRef, useState } from "react";
import { Brain, Send, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Give me a quick focus tip!",
  "Why is memory important?",
  "Help me understand my feelings",
  "What game should I play next?",
];

const STORAGE_KEY = "brightways_chat_history";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ChatMessage =>
        m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    );
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    // ignore quota errors
  }
}

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setError(null);

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: trimmed,
    };
    const assistantId = makeId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    const baseMessages = [...messages, userMessage];
    setMessages([...baseMessages, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          messages: baseMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Chat request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const updateAssistant = (mutator: (current: string) => string) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: mutator(m.content) } : m)),
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const block of events) {
          let event = "message";
          let data = "";
          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue;
          let payload: any = null;
          try {
            payload = JSON.parse(data);
          } catch {
            continue;
          }

          if (event === "token" && typeof payload?.delta === "string") {
            updateAssistant((current) => current + payload.delta);
          } else if (event === "done") {
            if (typeof payload?.content === "string" && payload.content.length > 0) {
              updateAssistant(() => payload.content);
            }
          } else if (event === "error") {
            throw new Error(payload?.error ?? "Stream error");
          }
        }
      }
    } catch (err) {
      if ((err as any)?.name === "AbortError") {
        return;
      }
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: m.content || "Sorry, I couldn't reach my brain right now. Please try again." }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4 animate-in fade-in duration-500 md:h-[calc(100vh-6rem)]">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-3 shadow-lg shadow-primary/30">
            <Brain className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Brightways Buddy</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Your friendly learning helper. Ask me anything!
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-clear-chat"
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            New chat
          </Button>
        )}
      </header>

      <Card className="flex flex-1 flex-col overflow-hidden border-2 border-primary/15 bg-card">
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4 md:p-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
                <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 p-6">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black">Hi! I'm Brightways Buddy 👋</h2>
                  <p className="max-w-md text-sm font-medium text-muted-foreground">
                    I can help you understand brain skills, suggest games, or chat about learning.
                    Pick a question to start, or type your own!
                  </p>
                </div>
                <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void sendMessage(s)}
                      disabled={isStreaming}
                      className="rounded-xl border-2 border-primary/15 bg-primary/5 p-3 text-left text-sm font-bold text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 disabled:opacity-60"
                      data-testid={`suggestion-${s.slice(0, 12)}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-3",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                  data-testid={`message-${m.role}`}
                >
                  {m.role === "assistant" && (
                    <div className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary md:flex">
                      <Brain className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm font-medium"
                        : "bg-muted text-foreground rounded-bl-sm",
                    )}
                  >
                    {m.content || (isStreaming && m.role === "assistant" ? (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Thinking...
                      </span>
                    ) : null)}
                  </div>
                </div>
              ))
            )}
            <div ref={scrollEndRef} />
          </div>
        </ScrollArea>

        {error && (
          <div className="border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t-2 border-primary/10 bg-background/40 p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Brightways Buddy..."
              disabled={isStreaming}
              rows={1}
              className="min-h-[44px] max-h-32 resize-none rounded-xl border-2 border-primary/15 bg-card text-sm font-medium focus-visible:border-primary"
              data-testid="input-chat"
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl"
              disabled={!input.trim() || isStreaming}
              data-testid="button-send"
            >
              {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Press Enter to send · Shift + Enter for a new line
          </p>
        </form>
      </Card>
    </div>
  );
}
