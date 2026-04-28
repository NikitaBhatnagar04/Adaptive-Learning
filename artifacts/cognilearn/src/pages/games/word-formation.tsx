import { useState, useEffect, useRef } from "react";
import { motion, Reorder } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function WordFormation() {
  return (
    <GameWrapper
      gameType="word_formation"
      title="Word Builder"
      description="Drag the letters to spell the word correctly!"
      difficulty={2}
    >
      {({ isActive, onComplete }) => <WordFormationGame isActive={isActive} onComplete={onComplete} />}
    </GameWrapper>
  );
}

const WORD_POOL = [
  { word: "CAT", image: "🐱" }, { word: "DOG", image: "🐶" }, { word: "BIRD", image: "🐦" },
  { word: "FISH", image: "🐟" }, { word: "FROG", image: "🐸" }, { word: "BEAR", image: "🐻" },
  { word: "DUCK", image: "🦆" }, { word: "WOLF", image: "🐺" }, { word: "LION", image: "🦁" },
  { word: "GOAT", image: "🐐" }, { word: "HORSE", image: "🐴" }, { word: "MOUSE", image: "🐭" },
  { word: "TIGER", image: "🐯" }, { word: "PANDA", image: "🐼" }, { word: "ZEBRA", image: "🦓" },
  { word: "SNAKE", image: "🐍" }, { word: "WHALE", image: "🐳" }, { word: "SHARK", image: "🦈" },
  { word: "EAGLE", image: "🦅" }, { word: "OWL", image: "🦉" }, { word: "BEE", image: "🐝" },
  { word: "ANT", image: "🐜" }, { word: "SUN", image: "☀️" }, { word: "MOON", image: "🌙" },
  { word: "STAR", image: "⭐" }, { word: "TREE", image: "🌳" }, { word: "LEAF", image: "🍃" },
  { word: "RAIN", image: "🌧️" }, { word: "SNOW", image: "❄️" }, { word: "FIRE", image: "🔥" },
  { word: "CAKE", image: "🍰" }, { word: "APPLE", image: "🍎" }, { word: "BREAD", image: "🍞" },
];

// Pick 6 random words per session, balanced toward the requested level
const WORDS = (() => {
  const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
})();

function WordFormationGame({ isActive, onComplete }: { isActive: boolean, onComplete: (stats: any) => void }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [letters, setLetters] = useState<{id: string, char: string}[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const statsRef = useRef({ correct: 0, wrong: 0, reactionTimes: [] as number[], startTime: 0 });

  useEffect(() => {
    if (!isActive) return;
    statsRef.current = { correct: 0, wrong: 0, reactionTimes: [], startTime: Date.now() };
    setScore(0);
    setRound(0);
    setupRound(0);
  }, [isActive]);

  const setupRound = (r: number) => {
    const currentWord = WORDS[r].word;
    const charArray = currentWord.split('').map((char, i) => ({ id: `${char}-${i}`, char }));
    // Shuffle
    charArray.sort(() => Math.random() - 0.5);
    setLetters(charArray);
    setIsSuccess(false);
    statsRef.current.startTime = Date.now();
  };

  const checkAnswer = () => {
    const currentWord = WORDS[round].word;
    const currentSpelling = letters.map(l => l.char).join('');
    
    if (currentSpelling === currentWord) {
      setIsSuccess(true);
      statsRef.current.correct++;
      setScore(s => s + 30);
      
      const rt = Date.now() - statsRef.current.startTime;
      statsRef.current.reactionTimes.push(rt);

      setTimeout(() => {
        if (round + 1 >= WORDS.length) {
          endGame();
        } else {
          setRound(r => r + 1);
          setupRound(round + 1);
        }
      }, 1500);
    } else {
      statsRef.current.wrong++;
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

  if (round >= WORDS.length) return null;

  const currentItem = WORDS[round];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md flex justify-between mb-8 absolute top-8">
        <div className="text-xl font-bold text-muted-foreground">Score: {score}</div>
        <div className="text-xl font-bold text-muted-foreground">Word: {round + 1}/{WORDS.length}</div>
      </div>

      <div className="text-9xl mb-12 animate-bounce">{currentItem.image}</div>

      <div className={`mb-12 transition-all duration-300 ${isSuccess ? 'scale-110' : ''}`}>
        <Reorder.Group 
          axis="x" 
          values={letters} 
          onReorder={setLetters} 
          className="flex gap-4"
        >
          {letters.map((item) => (
            <Reorder.Item 
              key={item.id} 
              value={item}
              className={`w-20 h-24 sm:w-24 sm:h-32 rounded-2xl flex items-center justify-center text-5xl font-black cursor-grab active:cursor-grabbing shadow-lg border-4 ${isSuccess ? 'bg-green-500 text-white border-green-600' : 'bg-card border-primary text-primary'}`}
            >
              {item.char}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {!isSuccess && (
        <Button 
          size="lg" 
          onClick={checkAnswer}
          className="rounded-full px-12 py-8 text-2xl font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl"
        >
          <Check className="mr-2 h-8 w-8" /> Check Word
        </Button>
      )}
    </div>
  );
}
