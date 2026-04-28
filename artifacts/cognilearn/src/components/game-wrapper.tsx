import { useState, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, RotateCcw, Home, Star, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import {
  useCreateSession,
  useUpdateSession,
  getGetProgressQueryKey,
  getGetProgressByGameQueryKey,
  getGetGameRecommendationQueryKey,
} from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUserId } from "@/lib/api-extra";

type GameType =
  | "attention_response"
  | "continuous_performance"
  | "task_switching"
  | "letter_sound"
  | "word_formation"
  | "visual_tracking"
  | "highlighted_reading"
  | "social_scenario"
  | "emotion_recognition"
  | "sensory_filtering"
  | "letter_recognition"
  | "pattern_recognition"
  | "sequencing_task"
  | "audio_word_match"
  | "speech_echo"
  | "mirror_match";

interface GameWrapperProps {
  gameType: GameType;
  title: string;
  description: string;
  difficulty?: number;
  children: (props: {
    isActive: boolean;
    onComplete: (stats: any) => void;
    session: any;
    difficulty: number;
  }) => ReactNode;
}

// Lightweight adaptive policy — bumps difficulty up or down based on stats.
function adapt(prev: number, stats: { accuracy?: number; reactionTimeMs?: number }) {
  const acc = stats.accuracy ?? 0;
  const rt = stats.reactionTimeMs ?? 0;
  let next = prev;
  let direction: "up" | "down" | "hold" = "hold";
  if (acc >= 85 && (rt === 0 || rt < 1500)) {
    next = Math.min(5, prev + 1);
    direction = "up";
  } else if (acc < 50) {
    next = Math.max(1, prev - 1);
    direction = "down";
  }
  return { next, direction };
}

export function GameWrapper({ gameType, title, description, difficulty: initialDifficulty = 1, children }: GameWrapperProps) {
  const [, setLocation] = useLocation();
  const [gameState, setGameState] = useState<"intro" | "playing" | "completed">("intro");
  const [session, setSession] = useState<any>(null);
  const [finalStats, setFinalStats] = useState<any>(null);
  const [activeDifficulty, setActiveDifficulty] = useState(initialDifficulty);
  const [adaptHint, setAdaptHint] = useState<"up" | "down" | "hold">("hold");

  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const queryClient = useQueryClient();

  // Fetch personalized starting difficulty for this game (best-effort)
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/adaptive/recommend`)
      .then((r) => (r.ok ? r.json() : null))
      .then((rec) => {
        if (cancelled || !rec) return;
        if (rec.gameType === gameType && typeof rec.suggestedDifficulty === "number") {
          setActiveDifficulty(rec.suggestedDifficulty);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [gameType]);

  const handleStart = async () => {
    const userId = getCurrentUserId();
    try {
      // Send userId via raw fetch since the generated client doesn't know about it
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType, difficulty: activeDifficulty, userId }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const newSession = await res.json();
      setSession(newSession);
      setGameState("playing");
    } catch (e) {
      console.error("Failed to start session", e);
      setSession({ id: Date.now(), gameType, difficulty: activeDifficulty });
      setGameState("playing");
    }
  };

  const handleComplete = async (stats: any) => {
    const normalizedStats = {
      ...stats,
      accuracy: typeof stats.accuracy === "number"
        ? Math.round(Math.min(100, Math.max(0, stats.accuracy)))
        : 100,
    };
    const { next, direction } = adapt(activeDifficulty, normalizedStats);
    setAdaptHint(direction);
    setFinalStats({ ...normalizedStats, nextDifficulty: next });
    setGameState("completed");

    if (session?.id) {
      try {
        await updateSession.mutateAsync({
          id: session.id,
          data: {
            ...normalizedStats,
            adaptiveFlags: { from: activeDifficulty, to: next, direction },
            completedAt: new Date().toISOString(),
          },
        });
        queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProgressByGameQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGameRecommendationQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      } catch (e) {
        console.error("Failed to complete session", e);
      }
    }
    // The next round will use the adapted difficulty
    setActiveDifficulty(next);
  };

  const handlePlayAgain = () => {
    setGameState("intro");
    setSession(null);
    setFinalStats(null);
  };

  return (
    <div className="max-w-4xl mx-auto w-full min-h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/games")}
          className="rounded-xl font-bold hover:bg-muted"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to Games
        </Button>
        <div className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold text-sm">
          Level {activeDifficulty}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-card rounded-3xl shadow-xl border-4 border-muted overflow-hidden relative">
        <AnimatePresence mode="wait">
          {gameState === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <Play className="h-12 w-12 text-primary ml-2" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">{title}</h1>
              <p className="text-xl text-muted-foreground font-medium max-w-lg mb-12">{description}</p>

              <Button
                size="lg"
                onClick={handleStart}
                disabled={createSession.isPending}
                className="text-2xl py-8 px-16 rounded-full font-black shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                data-testid="btn-start-game"
              >
                {createSession.isPending ? "Loading..." : "Let's Go! 🚀"}
              </Button>
            </motion.div>
          )}

          {gameState === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {children({ isActive: true, onComplete: handleComplete, session, difficulty: activeDifficulty })}
            </motion.div>
          )}

          {gameState === "completed" && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-primary/10 to-transparent"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="mb-8 relative"
              >
                <Star className="h-32 w-32 text-yellow-400 fill-yellow-400 drop-shadow-xl" />
                <Trophy className="h-16 w-16 text-yellow-600 absolute inset-0 m-auto" />
              </motion.div>

              <h2 className="text-5xl font-black text-foreground mb-2">Great Job! 🎉</h2>
              <p className="text-2xl font-bold text-primary mb-6">
                You earned {finalStats?.score ?? 100} points!
              </p>

              {adaptHint !== "hold" && (
                <div className={`mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                  adaptHint === "up" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {adaptHint === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  Next round: Level {finalStats?.nextDifficulty}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-10">
                <div className="bg-card border-2 p-4 rounded-2xl">
                  <p className="text-sm font-bold text-muted-foreground uppercase">Accuracy</p>
                  <p className="text-3xl font-black">{finalStats?.accuracy ?? 100}%</p>
                </div>
                <div className="bg-card border-2 p-4 rounded-2xl">
                  <p className="text-sm font-bold text-muted-foreground uppercase">Speed</p>
                  <p className="text-3xl font-black">
                    {finalStats?.reactionTimeMs ? `${Math.round(finalStats.reactionTimeMs)}ms` : "--"}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 flex-col sm:flex-row w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handlePlayAgain}
                  className="rounded-xl text-lg font-bold"
                >
                  <RotateCcw className="mr-2 h-5 w-5" /> Play Again
                </Button>
                <Button
                  size="lg"
                  onClick={() => setLocation("/games")}
                  className="rounded-xl text-lg font-bold"
                >
                  <Home className="mr-2 h-5 w-5" /> Back to Games
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
