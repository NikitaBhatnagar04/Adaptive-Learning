import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";

export default function SensoryFiltering() {
  return (
    <GameWrapper
      gameType="sensory_filtering"
      title="Laser Focus"
      description="Find the GLOWING STAR among the moving shapes and tap it! Ignore all the other shapes."
      difficulty={3}
    >
      {({ isActive, onComplete }) => <SensoryGame isActive={isActive} onComplete={onComplete} />}
    </GameWrapper>
  );
}

type Circle = {
  id: number;
  isTarget: boolean;
  x: number;
  y: number;
  color: string;
  size: number;
  emoji: string;
};

const DISTRACTOR_COLORS = [
  "bg-blue-400", "bg-red-400", "bg-green-400", "bg-pink-400",
  "bg-indigo-400", "bg-teal-400", "bg-orange-400", "bg-cyan-400",
];
const DISTRACTOR_EMOJIS = ["🔵", "🔴", "🟣", "🟤", "⬛", "🟥", "🔷", "🔶"];

function SensoryGame({ isActive, onComplete }: { isActive: boolean; onComplete: (stats: any) => void }) {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const maxRounds = 10;
  const statsRef = useRef({ correct: 0, wrong: 0, reactionTimes: [] as number[], startTime: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const roundRef = useRef(0);

  const endGame = useCallback((finalScore: number) => {
    clearInterval(timerRef.current);
    const s = statsRef.current;
    const total = s.correct + s.wrong;
    onComplete({
      score: finalScore,
      accuracy: total > 0 ? Math.round((s.correct / total) * 100) : 0,
      reactionTimeMs: s.reactionTimes.length > 0
        ? s.reactionTimes.reduce((a, b) => a + b, 0) / s.reactionTimes.length
        : 0,
      wrongClicks: s.wrong,
    });
  }, [onComplete]);

  const spawnRound = useCallback((roundNum: number) => {
    statsRef.current.startTime = Date.now();
    const numDistractors = 4 + Math.min(roundNum, 6); // 4 to 10 distractors
    const targetX = 10 + Math.random() * 75;
    const targetY = 10 + Math.random() * 70;

    const newCircles: Circle[] = [
      {
        id: 0,
        isTarget: true,
        x: targetX,
        y: targetY,
        color: "bg-yellow-400",
        size: 80,
        emoji: "⭐",
      },
      ...Array.from({ length: numDistractors }, (_, i) => ({
        id: i + 1,
        isTarget: false,
        x: 5 + Math.random() * 85,
        y: 5 + Math.random() * 80,
        color: DISTRACTOR_COLORS[i % DISTRACTOR_COLORS.length],
        size: 60 + Math.floor(Math.random() * 30),
        emoji: DISTRACTOR_EMOJIS[i % DISTRACTOR_EMOJIS.length],
      })),
    ];
    setCircles(newCircles);
    setTimeLeft(5);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (!isActive) return;
    statsRef.current = { correct: 0, wrong: 0, reactionTimes: [], startTime: Date.now() };
    roundRef.current = 0;
    setScore(0);
    setRound(0);
    spawnRound(0);
  }, [isActive, spawnRound]);

  useEffect(() => {
    if (!isActive || circles.length === 0) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time ran out for this round — count as miss
          clearInterval(timerRef.current);
          statsRef.current.wrong++;
          setFeedback("bad");
          setTimeout(() => {
            const nextRound = roundRef.current + 1;
            if (nextRound >= maxRounds) {
              endGame(statsRef.current.correct * 20);
            } else {
              roundRef.current = nextRound;
              setRound(nextRound);
              spawnRound(nextRound);
            }
          }, 800);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [circles, isActive, spawnRound, endGame]);

  const handleClick = (circle: Circle) => {
    clearInterval(timerRef.current);
    const rt = Date.now() - statsRef.current.startTime;

    if (circle.isTarget) {
      statsRef.current.correct++;
      statsRef.current.reactionTimes.push(rt);
      const newScore = statsRef.current.correct * 20;
      setScore(newScore);
      setFeedback("good");
    } else {
      statsRef.current.wrong++;
      setFeedback("bad");
    }

    setTimeout(() => {
      const nextRound = roundRef.current + 1;
      if (nextRound >= maxRounds) {
        endGame(statsRef.current.correct * 20);
      } else {
        roundRef.current = nextRound;
        setRound(nextRound);
        spawnRound(nextRound);
      }
    }, 700);
  };

  const pct = (timeLeft / 5) * 100;

  return (
    <div className="flex-1 flex flex-col select-none">
      {/* HUD */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-muted">
        <div className="font-black text-lg">⭐ {score} pts</div>
        <div className="flex items-center gap-2 font-bold text-sm">
          Round {round + 1}/{maxRounds}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-4 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 2 ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-black text-sm">{timeLeft}s</span>
        </div>
      </div>

      {/* Instruction */}
      <div className="text-center py-3 font-black text-lg text-primary">
        Find and tap the glowing ⭐ star!
      </div>

      {/* Arena */}
      <div className="flex-1 relative overflow-hidden bg-slate-900 rounded-b-3xl">
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex items-center justify-center z-30 text-8xl pointer-events-none`}
            >
              {feedback === "good" ? "✅" : "❌"}
            </motion.div>
          )}
        </AnimatePresence>

        {circles.map((circle) => (
          <motion.button
            key={`${round}-${circle.id}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={circle.isTarget ? {
              scale: [1, 1.15, 1],
              opacity: 1,
              transition: { scale: { duration: 0.8, repeat: Infinity }, opacity: { duration: 0.2 } }
            } : {
              x: [0, (Math.random() - 0.5) * 40, 0],
              y: [0, (Math.random() - 0.5) * 30, 0],
              scale: 1,
              opacity: 1,
              transition: { x: { duration: 2 + Math.random(), repeat: Infinity }, y: { duration: 1.5 + Math.random(), repeat: Infinity }, opacity: { duration: 0.2 } }
            }}
            onClick={() => handleClick(circle)}
            style={{
              position: "absolute",
              left: `${circle.x}%`,
              top: `${circle.y}%`,
              width: circle.size,
              height: circle.size,
              marginLeft: -circle.size / 2,
              marginTop: -circle.size / 2,
            }}
            className={`rounded-full flex items-center justify-center text-3xl z-10 border-4 ${
              circle.isTarget
                ? "bg-yellow-400 border-white shadow-[0_0_40px_rgba(250,204,21,0.9)] z-20"
                : "border-transparent opacity-80"
            } ${!circle.isTarget ? circle.color : ""}`}
          >
            {circle.emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
