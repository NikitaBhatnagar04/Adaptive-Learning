import { useState, useEffect, useRef } from "react";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { Play, Pause, CheckCircle2, ChevronRight } from "lucide-react";

export default function HighlightedReading() {
  return (
    <GameWrapper
      gameType="highlighted_reading"
      title="Read Along"
      description="Press Play and read each word as it lights up. Go at your own pace!"
      difficulty={1}
    >
      {({ isActive, onComplete }) => <HighlightedReadingGame isActive={isActive} onComplete={onComplete} />}
    </GameWrapper>
  );
}

const PASSAGES = [
  {
    title: "The Friendly Robot",
    text: "A little robot loved to play games. It made new friends every day. Together they explored the playground."
  },
  {
    title: "The Blue Butterfly",
    text: "A blue butterfly flew past the flowers. It landed on a leaf and rested. The sun made its wings sparkle."
  },
  {
    title: "The Kind Dog",
    text: "Biscuit the dog found a lost kitten. He shared his warm bed with it. They became the best of friends."
  },
  {
    title: "The Rainbow",
    text: "After the rain a rainbow appeared. It had seven colours in the sky. Everyone stopped to look and smile."
  },
  {
    title: "The Little Seed",
    text: "A small seed was planted in soil. It drank the rain and felt the sun. Soon it grew into a tall tree."
  },
];

function HighlightedReadingGame({ isActive, onComplete }: { isActive: boolean; onComplete: (stats: any) => void }) {
  const [passageIndex, setPassageIndex] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [passageDone, setPassageDone] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const totalPassages = PASSAGES.length;

  useEffect(() => {
    if (!isActive) return;
    setPassageIndex(0);
    setCurrentIndex(-1);
    setIsDone(false);
    setPassageDone(false);
    setIsPlaying(false);
    return () => window.speechSynthesis.cancel();
  }, [isActive]);

  useEffect(() => {
    const passage = PASSAGES[passageIndex];
    setWords(passage.text.split(" "));
    setCurrentIndex(-1);
    setIsPlaying(false);
    setPassageDone(false);
  }, [passageIndex]);

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (currentIndex === -1 || passageDone) {
        startReading();
      } else {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      }
    }
  };

  const startReading = () => {
    window.speechSynthesis.cancel();
    const passage = PASSAGES[passageIndex];
    const wordList = passage.text.split(" ");
    setCurrentIndex(0);
    setPassageDone(false);
    setIsPlaying(true);

    const utterance = new SpeechSynthesisUtterance(passage.text);
    utterance.rate = 0.6;
    utterance.pitch = 1.1;

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const before = passage.text.substring(0, event.charIndex);
        const wordIndex = before.split(" ").length - 1;
        setCurrentIndex(wordIndex);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setPassageDone(true);
      setCurrentIndex(wordList.length);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleNextPassage = () => {
    window.speechSynthesis.cancel();
    if (passageIndex + 1 >= totalPassages) {
      setIsDone(true);
    } else {
      setPassageIndex((p) => p + 1);
    }
  };

  const handleComplete = () => {
    window.speechSynthesis.cancel();
    onComplete({ score: 100, accuracy: 100, reactionTimeMs: 0 });
  };

  if (isDone) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="text-8xl">🌟</div>
        <h2 className="text-4xl font-black text-primary">You read them all!</h2>
        <p className="text-xl text-muted-foreground font-medium">Brilliant reading!</p>
        <Button size="lg" onClick={handleComplete} className="rounded-2xl px-10 py-6 text-xl font-black bg-green-500 hover:bg-green-400 text-white">
          <CheckCircle2 className="mr-2 h-6 w-6" /> Finish
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-6 md:p-10 gap-6">
      {/* Passage progress */}
      <div className="w-full flex items-center justify-between">
        <span className="font-black text-lg text-muted-foreground">
          Story {passageIndex + 1} of {totalPassages}
        </span>
        <span className="font-black text-lg text-primary">{PASSAGES[passageIndex].title}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(passageIndex / totalPassages) * 100}%` }}
        />
      </div>

      {/* Text card */}
      <div className="w-full max-w-2xl bg-card rounded-3xl p-8 md:p-12 shadow-inner border-4 border-primary/10 flex items-center justify-center min-h-[200px]">
        <p className="text-3xl md:text-4xl leading-loose text-center font-semibold text-muted-foreground">
          {words.map((word, idx) => (
            <span
              key={idx}
              className={`inline-block mx-1 px-2 py-1 rounded-xl transition-all duration-200 ${
                idx === currentIndex
                  ? "bg-accent text-accent-foreground font-black shadow scale-110 inline-block"
                  : idx < currentIndex
                  ? "text-foreground font-bold"
                  : ""
              }`}
            >
              {word}
            </span>
          ))}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <Button
          size="lg"
          onClick={togglePlay}
          className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 shadow-xl"
        >
          {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
        </Button>

        {passageDone && (
          <Button
            size="lg"
            onClick={handleNextPassage}
            className="rounded-full px-8 h-20 text-xl font-black bg-green-500 hover:bg-green-400 text-white shadow-xl"
          >
            {passageIndex + 1 >= totalPassages ? (
              <><CheckCircle2 className="mr-2 h-6 w-6" /> All Done!</>
            ) : (
              <>Next Story <ChevronRight className="ml-2 h-6 w-6" /></>
            )}
          </Button>
        )}
      </div>

      <p className="text-muted-foreground font-medium text-center">
        Press Play, then read each word out loud as it glows!
      </p>
    </div>
  );
}
