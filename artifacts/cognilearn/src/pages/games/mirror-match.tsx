import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameWrapper } from "@/components/game-wrapper";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, AlertCircle, Check } from "lucide-react";

const PROMPTS = [
  { emoji: "😀", label: "BIG SMILE" },
  { emoji: "😮", label: "SURPRISED" },
  { emoji: "👋", label: "WAVE HELLO" },
  { emoji: "🙌", label: "HANDS UP" },
  { emoji: "🤔", label: "THINKING FACE" },
  { emoji: "🎵", label: "DANCE TIME" },
  { emoji: "🤫", label: "SHH... QUIET" },
  { emoji: "👍", label: "THUMBS UP" },
];

export default function MirrorMatch() {
  return (
    <GameWrapper
      gameType="mirror_match"
      title="Mirror Mirror"
      description="Use the camera to copy the action shown — then tap when you've done it!"
      difficulty={1}
    >
      {({ isActive, onComplete }) => <Game isActive={isActive} onComplete={onComplete} />}
    </GameWrapper>
  );
}

function Game({ isActive, onComplete }: { isActive: boolean; onComplete: (s: any) => void }) {
  const TOTAL = 5;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [done, setDone] = useState<boolean[]>([]);
  const stats = useRef({ done: 0, rts: [] as number[], roundStart: 0 });

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setAllowed(true);
      setError(null);
    } catch (e: any) {
      setAllowed(false);
      setError(e?.message ?? "Camera access denied. The game still works without it.");
    }
  };

  useEffect(() => {
    if (!isActive) return;
    stats.current = { done: 0, rts: [], roundStart: Date.now() };
    setIdx(0);
    setDone([]);
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    requestCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [isActive]);

  const handleDid = () => {
    const rt = Date.now() - stats.current.roundStart;
    stats.current.rts.push(rt);
    stats.current.done++;
    setDone((d) => [...d, true]);

    setTimeout(() => {
      const next = idx + 1;
      if (next >= TOTAL) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const accuracy = (stats.current.done / TOTAL) * 100;
        const rtAvg = stats.current.rts.reduce((a, b) => a + b, 0) / Math.max(1, stats.current.rts.length);
        onComplete({
          score: stats.current.done * 20,
          accuracy,
          reactionTimeMs: rtAvg,
        });
        return;
      }
      setIdx(next);
      setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
      stats.current.roundStart = Date.now();
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-bold text-muted-foreground">Round {Math.min(idx + 1, TOTAL)} / {TOTAL}</span>
        <span className="text-sm font-bold text-primary">⭐ {stats.current.done}</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-6">
        <motion.div className="h-full bg-primary" animate={{ width: `${(idx / TOTAL) * 100}%` }} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-center max-w-3xl mx-auto w-full">
        <div className="aspect-video bg-black rounded-2xl overflow-hidden border-4 border-muted shadow-lg flex items-center justify-center text-white">
          {allowed === false ? (
            <div className="text-center px-4">
              <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-70" />
              <p className="font-bold">Camera off</p>
              <Button size="sm" variant="secondary" onClick={requestCamera} className="mt-3">
                Try again
              </Button>
            </div>
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
          )}
        </div>

        <div className="text-center">
          <motion.div
            key={prompt.emoji}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-primary/10 rounded-3xl py-6"
          >
            <div className="text-9xl mb-3">{prompt.emoji}</div>
            <div className="text-3xl font-black text-primary">{prompt.label}</div>
          </motion.div>

          <Button
            size="lg"
            onClick={handleDid}
            className="mt-6 rounded-full text-xl font-black py-7 px-10 shadow-lg"
            data-testid="btn-done"
          >
            <Check className="h-6 w-6 mr-2" /> I Did It!
          </Button>
        </div>
      </div>

      {error && (
        <div className="mx-auto mt-4 inline-flex items-center gap-2 bg-amber-100 text-amber-800 rounded-xl px-4 py-2 text-sm font-medium">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
    </div>
  );
}
