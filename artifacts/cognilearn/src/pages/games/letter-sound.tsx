import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LetterSound() {
  return (
    <GameWrapper
      gameType="letter_sound"
      title="Sound Match"
      description="Hear the letter sound and pick the matching word!"
      difficulty={1}
    >
      {({ isActive, onComplete }) => <LetterSoundGame isActive={isActive} onComplete={onComplete} />}
    </GameWrapper>
  );
}

const ITEMS = [
  { letter: "B", phonetic: "Buh — like in Bear", phrase: "B says buh. Which word starts with B?", words: ["Bear", "Apple", "Sun", "Dog"], correct: "Bear", emoji: "🐻" },
  { letter: "S", phonetic: "Sss — like in Snake", phrase: "S says ssss. Which word starts with S?", words: ["Snake", "Tiger", "Bird", "Fish"], correct: "Snake", emoji: "🐍" },
  { letter: "M", phonetic: "Mmm — like in Moon", phrase: "M says mmm. Which word starts with M?", words: ["Moon", "Lion", "Zebra", "Pig"], correct: "Moon", emoji: "🌙" },
  { letter: "C", phonetic: "Kuh — like in Cat", phrase: "C says kuh. Which word starts with C?", words: ["Cat", "Dog", "Mouse", "Bird"], correct: "Cat", emoji: "🐱" },
  { letter: "P", phonetic: "Puh — like in Parrot", phrase: "P says puh. Which word starts with P?", words: ["Parrot", "Horse", "Sheep", "Fox"], correct: "Parrot", emoji: "🦜" },
  { letter: "T", phonetic: "Tuh — like in Tiger", phrase: "T says tuh. Which word starts with T?", words: ["Tiger", "Rabbit", "Cow", "Duck"], correct: "Tiger", emoji: "🐯" },
  { letter: "F", phonetic: "Fff — like in Fish", phrase: "F says fff. Which word starts with F?", words: ["Fish", "Ant", "Bear", "Cow"], correct: "Fish", emoji: "🐟" },
  { letter: "D", phonetic: "Duh — like in Dog", phrase: "D says duh. Which word starts with D?", words: ["Dog", "Cat", "Lion", "Bee"], correct: "Dog", emoji: "🐶" },
];

// Female voice name fragments to search for (in priority order)
const FEMALE_VOICE_HINTS = [
  "samantha", "victoria", "karen", "moira", "fiona", "tessa", "veena",
  "zira", "hazel", "susan", "eva", "female", "woman",
  "google uk english female", "google us english",
];

function getFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));

  for (const hint of FEMALE_VOICE_HINTS) {
    const match = englishVoices.find((v) => v.name.toLowerCase().includes(hint));
    if (match) return match;
  }
  // Fallback: any English voice
  return englishVoices[0] ?? voices[0] ?? null;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function LetterSoundGame({ isActive, onComplete }: { isActive: boolean; onComplete: (stats: any) => void }) {
  const [items] = useState(() => shuffle(ITEMS).slice(0, 5));
  const [round, setRound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<{ word: string; correct: boolean } | null>(null);
  const [displayWords, setDisplayWords] = useState<string[]>([]);
  const [voiceReady, setVoiceReady] = useState(false);
  const statsRef = useRef({ correct: 0, wrong: 0, reactionTimes: [] as number[], startTime: 0 });
  const maxRounds = items.length;

  // Wait for voices to load (async in most browsers)
  useEffect(() => {
    const load = () => {
      if (window.speechSynthesis.getVoices().length > 0) setVoiceReady(true);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  useEffect(() => {
    if (!isActive) return;
    statsRef.current = { correct: 0, wrong: 0, reactionTimes: [], startTime: Date.now() };
    setRound(0);
    setFeedback(null);
  }, [isActive]);

  // Shuffle the display words once per round
  useEffect(() => {
    if (round < maxRounds) {
      setDisplayWords(shuffle(items[round].words));
      setFeedback(null);
    }
  }, [round, items, maxRounds]);

  // Auto-play sound on each new round (after voices load)
  useEffect(() => {
    if (isActive && round < maxRounds && voiceReady) {
      statsRef.current.startTime = Date.now();
      const timer = setTimeout(() => playSound(items[round].phrase), 600);
      return () => clearTimeout(timer);
    }
  }, [round, isActive, items, maxRounds, voiceReady]);

  const playSound = (text: string) => {
    window.speechSynthesis.cancel();
    setIsPlaying(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.72;
    utterance.pitch = 1.25; // slightly higher pitch sounds more feminine

    const femaleVoice = getFemaleVoice();
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelect = (word: string) => {
    if (feedback !== null) return;
    const currentItem = items[round];
    const isCorrect = word === currentItem.correct;
    const rt = Date.now() - statsRef.current.startTime;
    statsRef.current.reactionTimes.push(rt);

    setFeedback({ word, correct: isCorrect });

    if (isCorrect) {
      statsRef.current.correct++;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Correct! Great job!");
      u.rate = 0.85;
      u.pitch = 1.25;
      const v = getFemaleVoice();
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } else {
      statsRef.current.wrong++;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`Not quite. The answer is ${currentItem.correct}`);
      u.rate = 0.8;
      u.pitch = 1.2;
      const v = getFemaleVoice();
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    }

    setTimeout(() => {
      if (round + 1 >= maxRounds) {
        const s = statsRef.current;
        const avgReact = s.reactionTimes.reduce((a, b) => a + b, 0) / (s.reactionTimes.length || 1);
        onComplete({ score: s.correct * 20, accuracy: Math.round((s.correct / maxRounds) * 100), reactionTimeMs: avgReact, wrongClicks: s.wrong });
      } else {
        setRound((r) => r + 1);
      }
    }, 2000);
  };

  if (round >= maxRounds) return null;
  const currentItem = items[round];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
      {/* Progress */}
      <div className="w-full max-w-lg flex items-center justify-between">
        <span className="font-black text-muted-foreground">Round {round + 1}/{maxRounds}</span>
        <span className="font-black text-primary">⭐ {statsRef.current.correct * 20} pts</span>
      </div>

      {/* Letter display */}
      <div className="text-center">
        <div className="text-9xl font-black text-primary mb-2">{currentItem.letter}</div>
        <div className="text-3xl mb-2">{currentItem.emoji}</div>
        <p className="text-muted-foreground font-bold">{currentItem.phonetic}</p>
      </div>

      {/* Play button */}
      <Button
        size="lg"
        onClick={() => playSound(currentItem.phrase)}
        disabled={isPlaying || feedback !== null}
        className="rounded-full w-18 h-18 p-5 bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl"
      >
        <Volume2 className="h-8 w-8" />
      </Button>

      {/* Word choices */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {displayWords.map((word) => (
          <motion.button
            key={word}
            whileHover={feedback === null ? { scale: 1.05 } : {}}
            whileTap={feedback === null ? { scale: 0.95 } : {}}
            onClick={() => handleSelect(word)}
            disabled={feedback !== null}
            className={`p-5 rounded-3xl text-2xl font-black shadow-md border-4 transition-all ${
              feedback === null
                ? "bg-card border-primary/20 hover:border-primary hover:shadow-lg"
                : feedback.word === word
                ? feedback.correct
                  ? "bg-green-100 border-green-500 text-green-900"
                  : "bg-red-100 border-red-400 text-red-900"
                : word === currentItem.correct && feedback !== null
                ? "bg-green-50 border-green-400"
                : "bg-muted/30 border-transparent opacity-50"
            }`}
          >
            {word}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-xl font-black ${feedback.correct ? "text-green-600" : "text-orange-600"}`}
          >
            {feedback.correct ? "🎉 Correct!" : `The answer is "${currentItem.correct}"`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
