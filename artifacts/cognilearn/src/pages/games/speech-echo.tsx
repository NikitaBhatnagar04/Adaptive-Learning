import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, AlertCircle } from "lucide-react";

const WORDS = [
  "apple", "tiger", "music", "happy", "smile", "magic", "robot", "cloud",
  "river", "purple", "yellow", "rocket", "garden", "rabbit", "pencil",
  "circle", "elephant", "umbrella", "butterfly", "rainbow",
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9; u.pitch = 1.15; u.lang = "en-US";
  window.speechSynthesis.speak(u);
}

type SR = any; // SpeechRecognition is non-standard typed
function getRecognizer(): SR | null {
  if (typeof window === "undefined") return null;
  const C = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!C) return null;
  const r = new C();
  r.lang = "en-US";
  r.interimResults = false;
  r.maxAlternatives = 3;
  return r;
}

export default function SpeechEcho() {
  return (
    <GameWrapper
      gameType="speech_echo"
      title="Say It Right"
      description="Listen to the word, then say it out loud!"
      difficulty={1}
    >
      {({ isActive, onComplete, difficulty }) => (
        <Game isActive={isActive} onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function Game({ isActive, onComplete, difficulty }: { isActive: boolean; onComplete: (s: any) => void; difficulty: number }) {
  const TOTAL = 6;
  const [target, setTarget] = useState("");
  const [idx, setIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string>("");
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SR | null>(null);
  const stats = useRef({ correct: 0, wrong: 0, rts: [] as number[], roundStart: 0 });

  const supported = typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const startRound = (i: number) => {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    setTarget(w);
    setHeard("");
    setFeedback(null);
    setError(null);
    stats.current.roundStart = Date.now();
    setTimeout(() => speak(w), 250);
  };

  useEffect(() => {
    if (!isActive) return;
    stats.current = { correct: 0, wrong: 0, rts: [], roundStart: Date.now() };
    setIdx(0);
    startRound(0);
    return () => {
      try { recRef.current?.stop?.(); } catch {}
      window.speechSynthesis?.cancel();
    };
  }, [isActive]);

  const finish = (ok: boolean) => {
    const rt = Date.now() - stats.current.roundStart;
    stats.current.rts.push(rt);
    if (ok) stats.current.correct++;
    else stats.current.wrong++;
    setFeedback(ok ? "ok" : "no");

    setTimeout(() => {
      const next = idx + 1;
      if (next >= TOTAL) {
        const accuracy = (stats.current.correct / TOTAL) * 100;
        const rtAvg = stats.current.rts.reduce((a, b) => a + b, 0) / stats.current.rts.length;
        onComplete({
          score: stats.current.correct * 15,
          accuracy,
          reactionTimeMs: rtAvg,
          wrongClicks: stats.current.wrong,
        });
        return;
      }
      setIdx(next);
      startRound(next);
    }, 1200);
  };

  const handleListen = () => {
    if (!supported) {
      setError("Microphone speech recognition isn't available in this browser.");
      return;
    }
    const r = getRecognizer();
    if (!r) { setError("Could not start the microphone."); return; }
    recRef.current = r;
    setError(null);
    setListening(true);
    setHeard("");

    r.onresult = (ev: any) => {
      const alts: string[] = [];
      for (let i = 0; i < ev.results[0].length; i++) {
        alts.push(ev.results[0][i].transcript.trim().toLowerCase());
      }
      const said = alts[0] || "";
      setHeard(said);
      const ok = alts.some((a) => a.includes(target));
      finish(ok);
    };
    r.onerror = (ev: any) => {
      setListening(false);
      if (ev.error === "not-allowed") {
        setError("Please allow microphone access to play this game.");
      } else if (ev.error === "no-speech") {
        setError("I didn't hear anything — try again!");
      } else {
        setError(`Mic error: ${ev.error}`);
      }
    };
    r.onend = () => setListening(false);
    try { r.start(); } catch (e) {
      setListening(false);
      setError("Could not start the microphone.");
    }
  };

  const handleSkip = () => finish(false);

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-muted-foreground">Round {idx + 1} / {TOTAL}</span>
        <span className="text-sm font-bold text-primary">⭐ {stats.current.correct}</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-8">
        <motion.div className="h-full bg-primary" animate={{ width: `${((idx + 1) / TOTAL) * 100}%` }} />
      </div>

      <div className="text-center mb-8">
        <p className="text-lg font-bold text-muted-foreground mb-2">Say this word:</p>
        <motion.div
          key={target}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block bg-primary/10 rounded-3xl px-12 py-6"
        >
          <span className="text-7xl font-black text-primary">{target}</span>
        </motion.div>
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={() => speak(target)}>
            <Volume2 className="h-4 w-4 mr-2" /> Hear it again
          </Button>
        </div>
      </div>

      <div className="text-center mb-6">
        <Button
          size="lg"
          onClick={handleListen}
          disabled={listening || !!feedback}
          className={`rounded-full text-2xl font-black py-10 px-14 shadow-xl ${listening ? "bg-rose-500 hover:bg-rose-500" : ""}`}
          data-testid="btn-listen"
        >
          {listening ? <><MicOff className="h-8 w-8 mr-3 animate-pulse" /> Listening…</> : <><Mic className="h-8 w-8 mr-3" /> Tap & Speak</>}
        </Button>
      </div>

      {heard && (
        <p className="text-center text-lg font-medium text-muted-foreground">
          I heard: <span className="font-black text-foreground">"{heard}"</span>
        </p>
      )}

      {feedback === "ok" && <p className="text-center text-2xl font-black text-emerald-600 mt-2">Yes! 🎉</p>}
      {feedback === "no" && <p className="text-center text-xl font-bold text-amber-600 mt-2">Not quite — keep practising!</p>}

      {error && (
        <div className="mx-auto mt-4 inline-flex items-center gap-2 bg-amber-100 text-amber-800 rounded-xl px-4 py-2 text-sm font-medium">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="text-center mt-6">
        <Button variant="ghost" size="sm" onClick={handleSkip} disabled={!!feedback}>
          Skip word
        </Button>
      </div>
    </div>
  );
}
