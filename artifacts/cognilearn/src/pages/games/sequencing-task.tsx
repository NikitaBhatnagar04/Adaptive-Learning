import { useState, useEffect, useRef } from "react";
import { motion, Reorder } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

type Item = { id: string; label: string; emoji: string; order: number };

const SEQUENCES: { theme: string; items: Item[] }[] = [
  {
    theme: "Morning routine",
    items: [
      { id: "a", label: "Wake up", emoji: "⏰", order: 1 },
      { id: "b", label: "Brush teeth", emoji: "🪥", order: 2 },
      { id: "c", label: "Eat breakfast", emoji: "🥣", order: 3 },
      { id: "d", label: "Go to school", emoji: "🎒", order: 4 },
    ],
  },
  {
    theme: "Plant a seed",
    items: [
      { id: "a", label: "Dig a hole", emoji: "⛏️", order: 1 },
      { id: "b", label: "Plant the seed", emoji: "🌱", order: 2 },
      { id: "c", label: "Water it", emoji: "💧", order: 3 },
      { id: "d", label: "Watch it grow", emoji: "🌳", order: 4 },
    ],
  },
  {
    theme: "Make a sandwich",
    items: [
      { id: "a", label: "Get bread", emoji: "🍞", order: 1 },
      { id: "b", label: "Add filling", emoji: "🧀", order: 2 },
      { id: "c", label: "Close it up", emoji: "🥪", order: 3 },
      { id: "d", label: "Take a bite", emoji: "😋", order: 4 },
    ],
  },
  {
    theme: "Lifecycle of a butterfly",
    items: [
      { id: "a", label: "Egg", emoji: "🥚", order: 1 },
      { id: "b", label: "Caterpillar", emoji: "🐛", order: 2 },
      { id: "c", label: "Cocoon", emoji: "🪺", order: 3 },
      { id: "d", label: "Butterfly", emoji: "🦋", order: 4 },
    ],
  },
  {
    theme: "Get ready for bed",
    items: [
      { id: "a", label: "Bath time", emoji: "🛁", order: 1 },
      { id: "b", label: "Pajamas on", emoji: "👕", order: 2 },
      { id: "c", label: "Read a book", emoji: "📖", order: 3 },
      { id: "d", label: "Lights out", emoji: "🌙", order: 4 },
    ],
  },
  {
    theme: "Counting up",
    items: [
      { id: "a", label: "One", emoji: "1️⃣", order: 1 },
      { id: "b", label: "Two", emoji: "2️⃣", order: 2 },
      { id: "c", label: "Three", emoji: "3️⃣", order: 3 },
      { id: "d", label: "Four", emoji: "4️⃣", order: 4 },
    ],
  },
];

export default function SequencingTask() {
  return (
    <GameWrapper
      gameType="sequencing_task"
      title="In Order, Please!"
      description="Drag the steps so they happen in the right order."
      difficulty={2}
    >
      {({ isActive, onComplete, difficulty }) => (
        <Game isActive={isActive} onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

function Game({ isActive, onComplete, difficulty }: { isActive: boolean; onComplete: (s: any) => void; difficulty: number }) {
  const TOTAL = 5;
  const [roundIdx, setRoundIdx] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [scenario, setScenario] = useState<typeof SEQUENCES[0] | null>(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<"ok" | "no" | null>(null);
  const stats = useRef({ correct: 0, wrong: 0, rts: [] as number[], roundStart: 0 });

  const setupRound = (i: number) => {
    const s = SEQUENCES[(i + Math.floor(Math.random() * SEQUENCES.length)) % SEQUENCES.length];
    setScenario(s);
    // Take more items at higher difficulty (max all)
    const count = Math.min(3 + difficulty, s.items.length);
    const subset = [...s.items].slice(0, count);
    const shuffled = [...subset].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setLocked(false);
    setFeedback(null);
    stats.current.roundStart = Date.now();
  };

  useEffect(() => {
    if (!isActive) return;
    stats.current = { correct: 0, wrong: 0, rts: [], roundStart: Date.now() };
    setRoundIdx(0);
    setupRound(0);
  }, [isActive, difficulty]);

  const handleCheck = () => {
    if (locked) return;
    setLocked(true);
    const rt = Date.now() - stats.current.roundStart;
    stats.current.rts.push(rt);
    const correct = items.every((it, i) => it.order === i + 1);
    if (correct) stats.current.correct++;
    else stats.current.wrong++;
    setFeedback(correct ? "ok" : "no");

    setTimeout(() => {
      const next = roundIdx + 1;
      if (next >= TOTAL) {
        const accuracy = (stats.current.correct / TOTAL) * 100;
        const rtAvg = stats.current.rts.reduce((a, b) => a + b, 0) / stats.current.rts.length;
        onComplete({
          score: stats.current.correct * 20,
          accuracy,
          reactionTimeMs: rtAvg,
          wrongClicks: stats.current.wrong,
        });
        return;
      }
      setRoundIdx(next);
      setupRound(next);
    }, 1200);
  };

  if (!scenario) return null;

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-muted-foreground">Round {roundIdx + 1} / {TOTAL}</span>
        <span className="text-sm font-bold text-primary">⭐ {stats.current.correct}</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-6">
        <motion.div className="h-full bg-primary" animate={{ width: `${((roundIdx + 1) / TOTAL) * 100}%` }} />
      </div>

      <h2 className="text-3xl font-black text-center mb-2">{scenario.theme}</h2>
      <p className="text-center text-muted-foreground font-medium mb-6">Drag to put these in order from first to last</p>

      <div className="flex justify-center mb-4 text-muted-foreground">
        <ArrowDown className="h-6 w-6" />
      </div>

      <Reorder.Group
        axis="y"
        values={items}
        onReorder={(v) => !locked && setItems(v as Item[])}
        className="space-y-3 max-w-md mx-auto w-full"
      >
        {items.map((it, i) => {
          const isRight = locked && it.order === i + 1;
          const isWrong = locked && it.order !== i + 1;
          return (
            <Reorder.Item key={it.id} value={it} dragListener={!locked}>
              <motion.div
                whileDrag={{ scale: 1.05, zIndex: 10 }}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl border-4 cursor-grab active:cursor-grabbing shadow-md select-none ${
                  isRight
                    ? "bg-emerald-100 border-emerald-400"
                    : isWrong
                    ? "bg-rose-100 border-rose-400"
                    : "bg-card border-muted hover:border-primary"
                }`}
              >
                <span className="text-xl font-black text-muted-foreground w-6 text-center">
                  {i + 1}
                </span>
                <span className="text-4xl">{it.emoji}</span>
                <span className="text-xl font-bold flex-1">{it.label}</span>
              </motion.div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      <div className="flex justify-center mt-8">
        <Button
          size="lg"
          onClick={handleCheck}
          disabled={locked}
          className="rounded-2xl text-lg font-black px-10"
          data-testid="btn-check"
        >
          {feedback === "ok" ? "Right! 🎉" : feedback === "no" ? "Not quite — next round" : "Check My Order"}
        </Button>
      </div>
    </div>
  );
}
