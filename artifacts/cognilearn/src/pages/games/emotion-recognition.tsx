import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";
import confetti from "canvas-confetti";

export default function EmotionRecognition() {
  return (
    <GameWrapper
      gameType="emotion_recognition"
      title="Face Feelings"
      description="Look at the face. How do you think they are feeling?"
      difficulty={1}
    >
      {({ isActive, onComplete }) => <EmotionGame isActive={isActive} onComplete={onComplete} />}
    </GameWrapper>
  );
}

const EMOTIONS = [
  { emoji: "😃", emotion: "Happy" },
  { emoji: "😢", emotion: "Sad" },
  { emoji: "😠", emotion: "Angry" },
  { emoji: "😨", emotion: "Scared" },
  { emoji: "😲", emotion: "Surprised" },
  { emoji: "😴", emotion: "Tired" },
];

function EmotionGame({ isActive, onComplete }: { isActive: boolean, onComplete: (stats: any) => void }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  
  const maxRounds = 6;
  const statsRef = useRef({ correct: 0, wrong: 0, reactionTimes: [] as number[], startTime: 0 });

  useEffect(() => {
    if (!isActive) return;
    statsRef.current = { correct: 0, wrong: 0, reactionTimes: [], startTime: Date.now() };
    setScore(0);
    setRound(0);
    setupRound(0);
  }, [isActive]);

  const setupRound = (r: number) => {
    const currentTarget = EMOTIONS[r];
    const opts = [currentTarget.emotion];
    
    // Add 3 random wrong options
    while (opts.length < 4) {
      const randomEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)].emotion;
      if (!opts.includes(randomEmotion)) {
        opts.push(randomEmotion);
      }
    }
    
    setOptions(opts.sort(() => Math.random() - 0.5));
    setFeedback(null);
    statsRef.current.startTime = Date.now();
  };

  const handleSelect = (selected: string) => {
    if (feedback !== null) return; // Prevent multiple clicks

    const currentTarget = EMOTIONS[round];
    const isCorrect = selected === currentTarget.emotion;
    
    const rt = Date.now() - statsRef.current.startTime;
    statsRef.current.reactionTimes.push(rt);

    if (isCorrect) {
      statsRef.current.correct++;
      setScore(s => s + 20);
      setFeedback("correct");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      
      setTimeout(() => {
        if (round + 1 >= maxRounds) {
          endGame();
        } else {
          setRound(r => r + 1);
          setupRound(round + 1);
        }
      }, 2000);
    } else {
      statsRef.current.wrong++;
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 1500); // Let them try again
    }
  };

  const endGame = () => {
    const s = statsRef.current;
    const avgReact = s.reactionTimes.length > 0 ? s.reactionTimes.reduce((a,b)=>a+b,0)/s.reactionTimes.length : 0;
    
    onComplete({
      score,
      accuracy: Math.round((s.correct / (s.correct + s.wrong)) * 100) || 100,
      reactionTimeMs: avgReact,
      wrongClicks: s.wrong
    });
  };

  if (round >= maxRounds) return null;

  const currentItem = EMOTIONS[round];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md flex justify-between mb-4 absolute top-8">
        <div className="text-xl font-bold text-muted-foreground">Score: {score}</div>
        <div className="text-xl font-bold text-muted-foreground">Face: {round + 1}/{maxRounds}</div>
      </div>

      <motion.div 
        key={currentItem.emoji}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-[12rem] md:text-[15rem] mb-12 drop-shadow-2xl"
      >
        {currentItem.emoji}
      </motion.div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {options.map((opt) => (
          <motion.button
            key={opt}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(opt)}
            className="p-6 bg-card border-4 border-primary/20 rounded-3xl text-2xl font-bold shadow-md hover:border-primary transition-all hover:bg-primary/5"
          >
            {opt}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {feedback === "wrong" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 bg-destructive text-destructive-foreground px-8 py-4 rounded-full text-xl font-bold shadow-lg"
          >
            Not quite! Look closer at the eyes and mouth.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
