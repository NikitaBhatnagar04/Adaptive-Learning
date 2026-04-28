import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

const WORD_BANK_BY_LEN: Record<number, string[]> = {
  3: ["cat", "dog", "sun", "hat", "pen", "bus", "cup", "bat", "fan", "jam", "log", "map", "net", "owl", "pig", "red", "sit", "top", "win", "zip"],
  4: ["bird", "fish", "frog", "moon", "star", "tree", "duck", "lamp", "milk", "rain", "ship", "wolf", "cake", "drum", "kite", "leaf", "play", "snow", "swim", "wind"],
  5: ["apple", "bread", "chair", "cloud", "horse", "house", "music", "plant", "queen", "robot", "smile", "spoon", "table", "tiger", "water", "world", "zebra", "lemon", "happy", "magic"],
};

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.85;
  utt.pitch = 1.15;
  utt.lang = "en-US";
  window.speechSynthesis.speak(utt);
}

type Round = { word: string; options: string[] };

function buildRound(level: number): Round {
  const len = level >= 3 ? 5 : level >= 2 ? 4 : 3;
  const bank = WORD_BANK_BY_LEN[len];
  const word = bank[Math.floor(Math.random() * bank.length)];
  const distractors = bank
    .filter((w) => w !== word)
    .sort(() => Math.random() - 0.5)
    .slice(0, level >= 3 ? 5 : 3);
  const options = [word, ...distractors].sort(() => Math.random() - 0.5);
  return { word, options };
}

export default function AudioWordMatch() {
  return (
    <GameWrapper
      gameType="audio_word_match"
      title="Hear It, Pick It"
      description="Listen carefully and tap the word you heard."
      difficulty={1}
    >
      {({ isActive, onComplete, difficulty }) => (
        <Game isActive={isActive} onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function Game({ isActive, onComplete, difficulty }: { isActive: boolean; onComplete: (s: any) => void; difficulty: number }) {
  const TOTAL = 10;
  const [round, setRound] = useState<Round | null>(null);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);
  const stats = useRef({ correct: 0, wrong: 0, rts: [] as number[], roundStart: 0 });

  const newRound = (i: number) => {
    const r = buildRound(difficulty);
    setRound(r);
    setFeedback(null);
    stats.current.roundStart = Date.now();
    setTimeout(() => speak(r.word), 200);
  };

  useEffect(() => {
    if (!isActive) return;
    stats.current = { correct: 0, wrong: 0, rts: [], roundStart: Date.now() };
    setIdx(0);
    newRound(0);
    return () => window.speechSynthesis?.cancel();
  }, [isActive, difficulty]);

  const handlePick = (opt: string) => {
    if (!round || feedback) return;
    const rt = Date.now() - stats.current.roundStart;
    stats.current.rts.push(rt);
    const ok = opt === round.word;
    if (ok) stats.current.correct++;
    else stats.current.wrong++;
    setFeedback(ok ? "ok" : "no");

    setTimeout(() => {
      const next = idx + 1;
      if (next >= TOTAL) {
        window.speechSynthesis?.cancel();
        const accuracy = (stats.current.correct / TOTAL) * 100;
        const rtAvg = stats.current.rts.reduce((a, b) => a + b, 0) / stats.current.rts.length;
        onComplete({
          score: stats.current.correct * 10,
          accuracy,
          reactionTimeMs: rtAvg,
          wrongClicks: stats.current.wrong,
        });
        return;
      }
      setIdx(next);
      newRound(next);
    }, 800);
  };

  if (!round) return null;

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-muted-foreground">Round {idx + 1} / {TOTAL}</span>
        <span className="text-sm font-bold text-primary">⭐ {stats.current.correct}</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-8">
        <motion.div className="h-full bg-primary" animate={{ width: `${((idx + 1) / TOTAL) * 100}%` }} />
      </div>

      {!supported && (
        <p className="text-center text-sm text-amber-700 bg-amber-100 rounded-xl py-2 mb-4 font-medium">
          Your browser doesn't support speech. Please try Chrome or Edge.
        </p>
      )}

      <div className="text-center mb-8">
        <Button
          size="lg"
          onClick={() => speak(round.word)}
          className="rounded-full text-2xl font-black py-10 px-12 shadow-xl"
          data-testid="btn-speak"
        >
          <Volume2 className="mr-3 h-8 w-8" /> Hear it again
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
        {round.options.map((opt, i) => {
          const isAnswer = feedback && opt === round.word;
          const isWrong = feedback === "no" && opt !== round.word;
          return (
            <motion.button
              key={`${idx}-${opt}`}
              whileHover={{ scale: feedback ? 1 : 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePick(opt)}
              disabled={!!feedback}
              className={`rounded-2xl py-6 text-3xl font-black border-4 transition-colors shadow-md ${
                isAnswer
                  ? "bg-emerald-500 text-white border-emerald-600"
                  : isWrong
                  ? "bg-rose-200 text-rose-700 border-rose-300 opacity-70"
                  : "bg-card text-foreground border-muted hover:border-primary"
              }`}
              data-testid={`opt-${opt}`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
