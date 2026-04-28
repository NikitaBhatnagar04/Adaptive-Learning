import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";

export default function AttentionResponse() {
  return (
    <GameWrapper
      gameType="attention_response"
      title="Catch the Green!"
      description="Click the button ONLY when it turns GREEN. If it's RED, don't click it! Be as fast as you can."
      difficulty={1}
    >
      {({ isActive, onComplete }) => <AttentionGame isActive={isActive} onComplete={onComplete} />}
    </GameWrapper>
  );
}

function AttentionGame({ isActive, onComplete }: { isActive: boolean, onComplete: (stats: any) => void }) {
  const [currentColor, setCurrentColor] = useState<"red" | "green" | "gray">("gray");
  const [score, setScore] = useState(0);
  const [trials, setTrials] = useState(0);
  const maxTrials = 15;
  
  const statsRef = useRef({
    reactionTimes: [] as number[],
    wrongClicks: 0,
    missedSignals: 0,
    startTime: Date.now()
  });

  const signalTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isActive) return;

    statsRef.current = {
      reactionTimes: [],
      wrongClicks: 0,
      missedSignals: 0,
      startTime: Date.now()
    };
    
    setScore(0);
    setTrials(0);
    nextTrial();

    return () => clearTimeout(timeoutRef.current);
  }, [isActive]);

  const nextTrial = () => {
    if (trials >= maxTrials) {
      endGame();
      return;
    }

    setCurrentColor("gray");
    
    // Random wait between 1-3 seconds
    const waitTime = Math.random() * 2000 + 1000;
    
    timeoutRef.current = setTimeout(() => {
      // 70% chance for green (target), 30% for red (distractor)
      const isTarget = Math.random() > 0.3;
      setCurrentColor(isTarget ? "green" : "red");
      signalTimeRef.current = Date.now();
      
      // Auto-advance if they missed a green or correctly ignored a red
      timeoutRef.current = setTimeout(() => {
        if (isTarget) {
          // Missed green
          statsRef.current.missedSignals++;
        } else {
          // Correctly ignored red
          setScore(s => s + 10);
        }
        setTrials(t => t + 1);
        nextTrial();
      }, 1500); // 1.5s to respond
      
    }, waitTime);
  };

  const endGame = () => {
    const s = statsRef.current;
    const avgReaction = s.reactionTimes.length > 0 
      ? s.reactionTimes.reduce((a,b) => a + b, 0) / s.reactionTimes.length 
      : 0;
      
    const accuracy = Math.round(((maxTrials - s.wrongClicks - s.missedSignals) / maxTrials) * 100);
    
    onComplete({
      score,
      accuracy: Math.max(0, accuracy),
      reactionTimeMs: Math.round(avgReaction),
      wrongClicks: s.wrongClicks,
      missedSignals: s.missedSignals
    });
  };

  const handleClick = () => {
    if (currentColor === "gray") return;

    clearTimeout(timeoutRef.current);
    
    const reactionTime = Date.now() - signalTimeRef.current;

    if (currentColor === "green") {
      statsRef.current.reactionTimes.push(reactionTime);
      setScore(s => s + 20);
    } else if (currentColor === "red") {
      statsRef.current.wrongClicks++;
      setScore(s => Math.max(0, s - 5));
    }

    setTrials(t => t + 1);
    nextTrial();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
      <div className="w-full max-w-md flex justify-between mb-12">
        <div className="text-xl font-bold text-muted-foreground">Score: {score}</div>
        <div className="text-xl font-bold text-muted-foreground">Round: {Math.min(trials + 1, maxTrials)}/{maxTrials}</div>
      </div>

      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.9 }}
        className={`w-64 h-64 rounded-full shadow-2xl transition-colors duration-200 ${
          currentColor === "green" ? "bg-green-500 hover:bg-green-400" :
          currentColor === "red" ? "bg-red-500 hover:bg-red-400" :
          "bg-gray-300"
        }`}
      >
        <span className="sr-only">Click when green</span>
      </motion.button>
    </div>
  );
}
