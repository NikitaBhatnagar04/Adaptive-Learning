import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";

export default function TaskSwitching() {
  return (
    <GameWrapper
      gameType="task_switching"
      title="Rule Switcher"
      description="Pay close attention! Sometimes the rule is to click by COLOR, sometimes by SHAPE."
      difficulty={2}
    >
      {({ isActive, onComplete }) => <TaskSwitchingGame isActive={isActive} onComplete={onComplete} />}
    </GameWrapper>
  );
}

const COLORS = ["bg-blue-500", "bg-red-500", "bg-green-500", "bg-yellow-500"];
const SHAPES = ["rounded-full", "rounded-none", "rotate-45", "rounded-2xl"]; // circle, square, diamond, rounded-square
const COLOR_NAMES = ["BLUE", "RED", "GREEN", "YELLOW"];
const SHAPE_NAMES = ["CIRCLE", "SQUARE", "DIAMOND", "ROUNDED SQUARE"];

type Rule = { type: 'color' | 'shape', target: string, displayRule: string };

function TaskSwitchingGame({ isActive, onComplete }: { isActive: boolean, onComplete: (stats: any) => void }) {
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [options, setOptions] = useState<{id: number, color: string, shape: string, isTarget: boolean}[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [showRuleTransition, setShowRuleTransition] = useState(true);
  
  const maxRounds = 15;
  const statsRef = useRef({ correct: 0, wrong: 0, reactionTimes: [] as number[], startTime: 0 });

  useEffect(() => {
    if (!isActive) return;
    statsRef.current = { correct: 0, wrong: 0, reactionTimes: [], startTime: Date.now() };
    setScore(0);
    setRound(0);
    generateNextRound(true);
  }, [isActive]);

  const generateNextRound = (forceNewRule = false) => {
    if (round >= maxRounds) {
      endGame();
      return;
    }

    // 30% chance to switch rule, or force it
    const shouldSwitchRule = forceNewRule || Math.random() < 0.3;
    
    let nextRule = currentRule;
    if (shouldSwitchRule || !currentRule) {
      const type = Math.random() > 0.5 ? 'color' : 'shape';
      const idx = Math.floor(Math.random() * 4);
      nextRule = {
        type,
        target: type === 'color' ? COLORS[idx] : SHAPES[idx],
        displayRule: `Click the ${type === 'color' ? COLOR_NAMES[idx] : SHAPE_NAMES[idx]} item!`
      };
      setCurrentRule(nextRule);
      setShowRuleTransition(true);
      
      setTimeout(() => {
        setShowRuleTransition(false);
        statsRef.current.startTime = Date.now();
      }, 2000);
    } else {
      statsRef.current.startTime = Date.now();
    }

    // Generate 4 options, 1 target, 3 distractors
    const newOptions = [];
    const targetIdx = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < 4; i++) {
      const isTarget = i === targetIdx;
      let color, shape;
      
      if (isTarget) {
        if (nextRule!.type === 'color') {
          color = nextRule!.target;
          shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        } else {
          shape = nextRule!.target;
          color = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
      } else {
        // Distractor logic to avoid accidental targets
        do {
          color = COLORS[Math.floor(Math.random() * COLORS.length)];
          shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        } while (
          (nextRule!.type === 'color' && color === nextRule!.target) ||
          (nextRule!.type === 'shape' && shape === nextRule!.target)
        );
      }
      
      newOptions.push({ id: i, color, shape, isTarget });
    }
    
    setOptions(newOptions);
  };

  const endGame = () => {
    const s = statsRef.current;
    const avgReact = s.reactionTimes.length > 0 ? s.reactionTimes.reduce((a,b)=>a+b,0)/s.reactionTimes.length : 0;
    const accuracy = Math.round((s.correct / maxRounds) * 100);
    
    onComplete({
      score,
      accuracy: Math.max(0, accuracy),
      reactionTimeMs: avgReact,
      wrongClicks: s.wrong
    });
  };

  const handleSelect = (isTarget: boolean) => {
    if (showRuleTransition) return;

    const rt = Date.now() - statsRef.current.startTime;
    statsRef.current.reactionTimes.push(rt);

    if (isTarget) {
      statsRef.current.correct++;
      setScore(s => s + 10);
    } else {
      statsRef.current.wrong++;
      setScore(s => Math.max(0, s - 5));
    }
    
    setRound(r => r + 1);
    generateNextRound();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md flex justify-between mb-8 absolute top-8">
        <div className="text-xl font-bold text-muted-foreground">Score: {score}</div>
        <div className="text-xl font-bold text-muted-foreground">Round: {Math.min(round + 1, maxRounds)}/{maxRounds}</div>
      </div>

      {showRuleTransition && currentRule ? (
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8 bg-primary/10 rounded-3xl border-4 border-primary"
        >
          <h2 className="text-3xl font-black text-primary mb-2">NEW RULE!</h2>
          <p className="text-2xl font-bold">{currentRule.displayRule}</p>
        </motion.div>
      ) : currentRule ? (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-12 bg-muted/50 px-6 py-3 rounded-full">{currentRule.displayRule}</h2>
          
          <div className="grid grid-cols-2 gap-8">
            {options.map((opt) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(opt.isTarget)}
                className={`w-32 h-32 flex items-center justify-center shadow-lg hover:shadow-xl transition-all bg-muted ${opt.color === 'bg-white' ? 'border-4 border-gray-200' : ''}`}
                style={{ backgroundColor: 'transparent' }} // Let inner div handle color
              >
                <div className={`w-24 h-24 ${opt.color} ${opt.shape} shadow-inner`}></div>
              </motion.button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
