import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

// All 26 letters in both cases
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const LOWER = "abcdefghijklmnopqrstuvwxyz".split("");

// Pairs that are commonly reversed/confused (dyslexia-relevant)
const REVERSAL_PAIRS: [string, string][] = [
  ["b", "d"], ["p", "q"], ["b", "p"], ["d", "q"], ["m", "w"], ["n", "u"],
  ["b", "p"], ["E", "3"], ["S", "Z"], ["a", "e"], ["i", "j"],
];

type Round = {
  prompt: string;
  options: string[];
  correctIndex: number;
  mode: "match" | "reversal";
};

function buildRound(level: number): Round {
  // Level 1: simple uppercase match. Level 2: lowercase. Level 3+: include reversal pairs.
  const useLower = level >= 2;
  const useReversal = level >= 3 && Math.random() < 0.6;
  const pool = useLower ? LOWER : UPPER;

  if (useReversal) {
    const [a, b] = REVERSAL_PAIRS[Math.floor(Math.random() * REVERSAL_PAIRS.length)];
    const target = Math.random() < 0.5 ? a : b;
    const distractor = target === a ? b : a;
    const extras = pool
      .filter((c) => c !== target && c !== distractor)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    const options = [target, distractor, ...extras].sort(() => Math.random() - 0.5);
    return {
      prompt: target,
      options,
      correctIndex: options.indexOf(target),
      mode: "reversal",
    };
  }

  const target = pool[Math.floor(Math.random() * pool.length)];
  const distractors = pool
    .filter((c) => c !== target)
    .sort(() => Math.random() - 0.5)
    .slice(0, level >= 4 ? 5 : 3);
  const options = [target, ...distractors].sort(() => Math.random() - 0.5);
  return {
    prompt: target,
    options,
    correctIndex: options.indexOf(target),
    mode: "match",
  };
}

export default function LetterRecognition() {
  return (
    <GameWrapper
      gameType="letter_recognition"
      title="Letter Hunt"
      description="Find the matching letter! Watch out for tricky look-alikes."
      difficulty={1}
    >
      {({ isActive, onComplete, difficulty }) => (
        <Game isActive={isActive} onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function Game({ isActive, onComplete, difficulty }: { isActive: boolean; onComplete: (s: any) => void; difficulty: number }) {
  const TOTAL_ROUNDS = 12;
  const [round, setRound] = useState<Round | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const stats = useRef({ correct: 0, wrong: 0, rts: [] as number[], startedAt: 0, roundStart: 0 });

  useEffect(() => {
    if (!isActive) return;
    stats.current = { correct: 0, wrong: 0, rts: [], startedAt: Date.now(), roundStart: Date.now() };
    setRoundIdx(0);
    setFeedback(null);
    setRound(buildRound(difficulty));
  }, [isActive, difficulty]);

  const handlePick = (idx: number) => {
    if (!round || feedback) return;
    const rt = Date.now() - stats.current.roundStart;
    stats.current.rts.push(rt);
    const ok = idx === round.correctIndex;
    if (ok) stats.current.correct++;
    else stats.current.wrong++;
    setFeedback(ok ? "correct" : "wrong");

    setTimeout(() => {
      const next = roundIdx + 1;
      if (next >= TOTAL_ROUNDS) {
        const accuracy = (stats.current.correct / TOTAL_ROUNDS) * 100;
        const rtAvg = stats.current.rts.reduce((a, b) => a + b, 0) / stats.current.rts.length;
        onComplete({
          score: stats.current.correct * 10,
          accuracy,
          reactionTimeMs: rtAvg,
          wrongClicks: stats.current.wrong,
        });
        return;
      }
      setRoundIdx(next);
      setFeedback(null);
      stats.current.roundStart = Date.now();
      setRound(buildRound(difficulty));
    }, 700);
  };

  if (!round) return null;

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-muted-foreground">
          Round {roundIdx + 1} / {TOTAL_ROUNDS}
        </span>
        <span className="text-sm font-bold text-primary">
          ⭐ {stats.current.correct} correct
        </span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-8">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((roundIdx + 1) / TOTAL_ROUNDS) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="text-center mb-6">
        <p className="text-lg font-bold text-muted-foreground mb-2">
          {round.mode === "reversal" ? "Careful — these look alike!" : "Tap the matching letter"}
        </p>
        <motion.div
          key={roundIdx}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center bg-primary/10 rounded-3xl px-12 py-8"
        >
          <span className="text-9xl font-black text-primary">{round.prompt}</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto w-full">
        {round.options.map((opt, idx) => {
          const isCorrect = feedback && idx === round.correctIndex;
          const isWrong = feedback === "wrong" && idx !== round.correctIndex;
          return (
            <motion.button
              key={`${roundIdx}-${idx}`}
              whileHover={{ scale: feedback ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePick(idx)}
              disabled={!!feedback}
              className={`relative aspect-square rounded-3xl text-6xl font-black border-4 transition-colors shadow-md ${
                isCorrect
                  ? "bg-emerald-500 text-white border-emerald-600"
                  : isWrong && feedback
                  ? "bg-rose-200 text-rose-700 border-rose-300"
                  : "bg-card text-foreground border-muted hover:border-primary hover:bg-primary/5"
              }`}
              data-testid={`opt-${idx}`}
            >
              {opt}
              <AnimatePresence>
                {isCorrect && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2 right-2"
                  >
                    <Check className="h-6 w-6 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
