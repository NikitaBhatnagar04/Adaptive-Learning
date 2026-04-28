import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Brain, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { upsertUser, setCurrentUser } from "@/lib/api-extra";

const AVATARS = ["🌟", "🦄", "🐯", "🐼", "🦊", "🐸", "🐙", "🦁", "🐶", "🐱"];

export default function Login() {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const id = localStorage.getItem("brightways_user_id");
    if (id) setLocation("/");
  }, [setLocation]);

  const handleStart = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setErr(null);
    try {
      const user = await upsertUser(trimmed, avatar);
      setCurrentUser(user);
      setLocation("/");
    } catch (e) {
      console.error(e);
      setErr("Hmm, we couldn't sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const EMOJIS = ["🌟", "🧠", "🎨", "🚀", "🎮", "🌈", "⚡", "🎯"];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-6 overflow-hidden relative">
      {EMOJIS.map((em, i) => (
        <motion.div
          key={i}
          className="absolute text-5xl select-none pointer-events-none opacity-20"
          style={{ left: `${(i * 13) % 90 + 5}%`, top: `${(i * 17 + 10) % 80 + 10}%` }}
          animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
        >
          {em}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-card rounded-3xl shadow-2xl border-4 border-primary/20 p-8 md:p-10 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary shadow-xl shadow-primary/30 mb-6"
        >
          <Brain className="h-14 w-14 text-primary-foreground" />
        </motion.div>

        <h1 className="text-5xl font-black text-primary mb-2 tracking-tight">Brightways</h1>
        <p className="text-lg text-muted-foreground font-medium mb-8">
          Your fun brain training adventure!
        </p>

        <div className="space-y-4">
          <label className="block text-xl font-black text-foreground">
            What's your name?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            placeholder="Type your name here..."
            autoFocus
            maxLength={30}
            className="w-full rounded-2xl border-4 border-primary/20 bg-background px-6 py-4 text-2xl font-bold text-center text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
            data-testid="input-name"
          />

          <div>
            <p className="text-sm font-bold text-muted-foreground mb-2">Pick your buddy</p>
            <div className="flex flex-wrap justify-center gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`text-3xl rounded-2xl p-2 border-4 transition-all ${
                    avatar === a
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-transparent bg-muted/40 hover:bg-muted"
                  }`}
                  data-testid={`avatar-${a}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {err && <p className="text-sm font-bold text-destructive">{err}</p>}

          <Button
            size="lg"
            onClick={handleStart}
            disabled={!name.trim() || busy}
            className="w-full rounded-2xl py-6 text-2xl font-black shadow-xl shadow-primary/30 hover:scale-105 transition-transform disabled:opacity-40 disabled:scale-100"
            data-testid="btn-start"
          >
            <Sparkles className="mr-2 h-6 w-6" /> {busy ? "Signing in..." : "Let's Go!"}
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground font-medium">
          Train your brain. Earn stars. Have fun!
        </p>
      </motion.div>
    </div>
  );
}
