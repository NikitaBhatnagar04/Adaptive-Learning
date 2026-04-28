import { useState, useEffect, useRef } from "react";
import { GameWrapper } from "@/components/game-wrapper";

export default function VisualTracking() {
  return (
    <GameWrapper
      gameType="visual_tracking"
      title="Star Tracker"
      description="Keep your mouse or finger ON the moving star for as long as you can!"
      difficulty={3}
    >
      {({ isActive, onComplete }) => <VisualTrackingGame isActive={isActive} onComplete={onComplete} />}
    </GameWrapper>
  );
}

const GAME_DURATION = 30;

function VisualTrackingGame({ isActive, onComplete }: { isActive: boolean; onComplete: (stats: any) => void }) {
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [isOnTarget, setIsOnTarget] = useState(false);

  const isOnTargetRef = useRef(false);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(GAME_DURATION);
  const tRef = useRef(0);
  const rafRef = useRef<number>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isActive) return;

    // Reset everything
    scoreRef.current = 0;
    timeLeftRef.current = GAME_DURATION;
    tRef.current = 0;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsOnTarget(false);
    isOnTargetRef.current = false;

    // Countdown timer
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        cancelAnimationFrame(rafRef.current!);
        const finalScore = scoreRef.current;
        onCompleteRef.current({
          score: Math.round(finalScore / 6),
          accuracy: Math.round(Math.min(100, (finalScore / (GAME_DURATION * 60)) * 100)),
          reactionTimeMs: 0,
        });
      }
    }, 1000);

    // Animation loop — smooth Lissajous path
    const animate = () => {
      tRef.current += 0.018;
      const x = 50 + 38 * Math.sin(tRef.current * 0.9);
      const y = 50 + 35 * Math.sin(tRef.current * 0.6 + 1.2);
      setTargetPos({ x, y });

      if (isOnTargetRef.current) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(rafRef.current!);
    };
  }, [isActive]);

  const handleEnter = () => {
    isOnTargetRef.current = true;
    setIsOnTarget(true);
  };

  const handleLeave = () => {
    isOnTargetRef.current = false;
    setIsOnTarget(false);
  };

  const pct = (timeLeft / GAME_DURATION) * 100;
  const displayScore = Math.round(scoreRef.current / 6);

  return (
    <div className="flex-1 flex flex-col p-6 select-none">
      {/* HUD */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-black">⭐ {displayScore} pts</div>
        <div className="flex items-center gap-2 flex-1 mx-6">
          <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 10 ? "bg-red-500" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-black text-lg w-10">{timeLeft}s</span>
        </div>
        <div className={`text-xl font-black ${isOnTarget ? "text-green-500" : "text-muted-foreground"}`}>
          {isOnTarget ? "ON TARGET! 🔥" : "Follow it!"}
        </div>
      </div>

      {/* Arena */}
      <div
        className="flex-1 relative bg-muted/20 rounded-3xl overflow-hidden border-4 border-primary/20"
        onMouseLeave={handleLeave}
      >
        {/* Moving star */}
        <div
          className={`absolute flex items-center justify-center text-6xl rounded-full transition-colors duration-100 cursor-pointer ${
            isOnTarget
              ? "text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,1)]"
              : "text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"
          }`}
          style={{
            left: `${targetPos.x}%`,
            top: `${targetPos.y}%`,
            transform: "translate(-50%, -50%)",
            width: 90,
            height: 90,
            fontSize: 64,
          }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onTouchStart={handleEnter}
          onTouchEnd={handleLeave}
        >
          ⭐
        </div>

        {isOnTarget && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-0 right-0 text-center text-2xl font-black text-green-500 animate-bounce">
              Keep going!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
