import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";

export default function ContinuousPerformance() {
  return (
    <GameWrapper
      gameType="continuous_performance"
      title="Symbol Stream"
      description="Press the button EVERY TIME you see a STAR (⭐). Don't press it for other shapes!"
      difficulty={2}
    >
      {({ isActive, onComplete }) => (
        <ContinuousGame isActive={isActive} onComplete={onComplete} />
      )}
    </GameWrapper>
  );
}

const SHAPES = ["⭐", "🟢", "🟦", "🔺", "💜"];
const TARGET = "⭐";

function ContinuousGame({
  isActive,
  onComplete,
}: {
  isActive: boolean;
  onComplete: (stats: any) => void;
}) {
  const [currentShape, setCurrentShape] = useState<string>("❓");
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0); // ✅ FIX: reliable score
  const [flash, setFlash] = useState<"success" | "error" | null>(null);

  const totalShapes = 30;
  const currentCountRef = useRef(0);
  const statsRef = useRef({
    correct: 0,
    wrong: 0,
    missed: 0,
    reactionTimes: [] as number[],
    lastShowTime: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const isTargetRef = useRef(false);
  const hasRespondedRef = useRef(false);

  useEffect(() => {
    if (!isActive) return;

    statsRef.current = {
      correct: 0,
      wrong: 0,
      missed: 0,
      reactionTimes: [],
      lastShowTime: 0,
    };

    setScore(0);
    scoreRef.current = 0; // ✅ reset
    currentCountRef.current = 0;

    nextShape();

    return () => clearTimeout(intervalRef.current);
  }, [isActive]);

  const nextShape = () => {
    if (currentCountRef.current >= totalShapes) {
      endGame();
      return;
    }

    // Missed previous target
    if (
      isTargetRef.current &&
      !hasRespondedRef.current &&
      currentCountRef.current > 0
    ) {
      statsRef.current.missed++;
    }

    const isTarget = Math.random() > 0.6;
    const shape = isTarget
      ? TARGET
      : SHAPES[Math.floor(Math.random() * (SHAPES.length - 1)) + 1];

    setCurrentShape(shape);
    isTargetRef.current = isTarget;
    hasRespondedRef.current = false;
    statsRef.current.lastShowTime = Date.now();
    currentCountRef.current++;
    setFlash(null);

    intervalRef.current = setTimeout(nextShape, 1500);
  };

  const endGame = () => {
    clearTimeout(intervalRef.current);
    const s = statsRef.current;

    const totalTargets = s.correct + s.missed;

    const accuracy =
      totalTargets > 0
        ? Math.round((s.correct / (totalTargets + s.wrong)) * 100)
        : 100;

    const avgReact =
      s.reactionTimes.length > 0
        ? s.reactionTimes.reduce((a, b) => a + b, 0) /
          s.reactionTimes.length
        : 0;

    onComplete({
      score: scoreRef.current, // ✅ FIXED
      accuracy: Math.max(0, accuracy),
      wrongClicks: s.wrong,
      missedSignals: s.missed,
      reactionTimeMs: avgReact,
    });
  };

  const handleRespond = () => {
    if (hasRespondedRef.current) return;
    hasRespondedRef.current = true;

    const rt = Date.now() - statsRef.current.lastShowTime;

    if (isTargetRef.current) {
      statsRef.current.correct++;
      statsRef.current.reactionTimes.push(rt);

      scoreRef.current += 10; // ✅ FIX
      setScore(scoreRef.current);

      setFlash("success");
    } else {
      statsRef.current.wrong++;

      scoreRef.current = Math.max(0, scoreRef.current - 5); // ✅ FIX
      setScore(scoreRef.current);

      setFlash("error");
    }
  };

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-8 select-none"
      onClick={handleRespond}
    >
      <div className="text-xl font-bold text-muted-foreground mb-8 absolute top-8">
        Score: {score}
      </div>

      <div className="text-2xl font-bold mb-12">
        Target: <span className="text-4xl">{TARGET}</span>
      </div>

      <motion.div
        key={currentCountRef.current}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        className={`w-80 h-80 flex items-center justify-center rounded-3xl shadow-xl bg-muted/30 border-8 transition-colors ${
          flash === "success"
            ? "border-green-500 bg-green-50"
            : flash === "error"
            ? "border-red-500 bg-red-50"
            : "border-transparent"
        }`}
      >
        <span style={{ fontSize: 140, lineHeight: 1 }}>
          {currentShape}
        </span>
      </motion.div>

      <div className="mt-12 text-muted-foreground font-bold">
        Tap anywhere or press Space when you see the target!
      </div>
    </div>
  );
}