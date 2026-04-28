import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";

const SHAPES = ["🔴", "🔵", "🟡", "🟢", "🟣", "🟠"];
const ANIMALS = ["🐶", "🐱", "🐭", "🐰", "🦊", "🐻"];

type Round = {
  sequence: string[];     // visible items
  hidden: string;         // the answer
  options: string[];      // choices
};

function buildRound(level: number): Round {
  const palette = level >= 3 ? [...SHAPES, ...ANIMALS] : SHAPES;
  const patternLen = Math.min(2 + level, 4); // 3-6 visible items
  const totalVisible = patternLen * (level >= 4 ? 3 : 2);

  // Pick a repeating sub-pattern (e.g. AB, ABC, AABB)
  const subPattern: string[] = [];
  for (let i = 0; i < patternLen; i++) {
    subPattern.push(palette[Math.floor(Math.random() * palette.length)]);
  }
  const sequence: string[] = [];
  for (let i = 0; i < totalVisible; i++) {
    sequence.push(subPattern[i % patternLen]);
  }
  const hidden = subPattern[totalVisible % patternLen];

  const distractors = palette
    .filter((p) => p !== hidden)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = [hidden, ...distractors].sort(() => Math.random() - 0.5);

  return { sequence, hidden, options };
}

export default function PatternRecognition() {
  return (
    <GameWrapper
      gameType="pattern_recognition"
      title="Pattern Power"
      description="What comes next? Find the missing piece in the pattern."
      difficulty={2}
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

  useEffect(() => {
    if (!isActive) return;
    stats.current = { correct: 0, wrong: 0, rts: [], roundStart: Date.now() };
    setIdx(0);
    setFeedback(null);
    setRound(buildRound(difficulty));
  }, [isActive, difficulty]);

  const handlePick = (choice: string) => {
    if (!round || feedback) return;
    const rt = Date.now() - stats.current.roundStart;
    stats.current.rts.push(rt);
    const ok = choice === round.hidden;
    if (ok) stats.current.correct++;
    else stats.current.wrong++;
    setFeedback(ok ? "ok" : "no");

    setTimeout(() => {
      const next = idx + 1;
      if (next >= TOTAL) {
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
      setFeedback(null);
      stats.current.roundStart = Date.now();
      setRound(buildRound(difficulty));
    }, 700);
  };

  if (!round) return null;

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-muted-foreground">Round {idx + 1} / {TOTAL}</span>
        <span className="text-sm font-bold text-primary">⭐ {stats.current.correct}</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-8">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((idx + 1) / TOTAL) * 100}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-10 bg-muted/30 rounded-2xl p-6">
        {round.sequence.map((s, i) => (
          <motion.span
            key={`${idx}-${i}`}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.05 }}
            className="text-5xl"
          >
            {s}
          </motion.span>
        ))}
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-5xl font-black text-primary border-4 border-dashed border-primary rounded-xl px-2"
        >
          ?
        </motion.span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto w-full">
        {round.options.map((opt, i) => {
          const isAnswer = feedback && opt === round.hidden;
          const isWrong = feedback === "no" && opt !== round.hidden;
          return (
            <motion.button
              key={`${idx}-${i}-${opt}`}
              whileHover={{ scale: feedback ? 1 : 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePick(opt)}
              disabled={!!feedback}
              className={`aspect-square rounded-3xl text-6xl border-4 transition-colors shadow-md ${
                isAnswer
                  ? "bg-emerald-500 border-emerald-600"
                  : isWrong
                  ? "bg-rose-200 border-rose-300 opacity-60"
                  : "bg-card border-muted hover:border-primary"
              }`}
              data-testid={`opt-${i}`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
