import { Link } from "wouter";
import {
  useGetProgress,
  getGetProgressQueryKey,
  useGetGameRecommendation,
  getGetGameRecommendationQueryKey,
  useGetProgressByGame,
  getGetProgressByGameQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Star, Flame, Play, Sparkles, Target, Users, BookOpen, ShieldAlert, Gamepad2, Trophy } from "lucide-react";

const GAME_ICONS: Record<string, string> = {
  attention_response: "🎯",
  continuous_performance: "⚡",
  task_switching: "🔀",
  letter_sound: "🔤",
  word_formation: "🧩",
  visual_tracking: "👁️",
  highlighted_reading: "📖",
  social_scenario: "🤝",
  emotion_recognition: "😊",
  sensory_filtering: "🎧",
};

const GAME_LABELS: Record<string, string> = {
  attention_response: "Catch the Green",
  continuous_performance: "Symbol Stream",
  task_switching: "Rule Switcher",
  letter_sound: "Sound Match",
  word_formation: "Word Builder",
  visual_tracking: "Star Tracker",
  highlighted_reading: "Read Along",
  social_scenario: "Friend Choices",
  emotion_recognition: "Face Feelings",
  sensory_filtering: "Laser Focus",
};

const SKILL_INFO = [
  { key: "attention", label: "Focus", icon: Target, color: "from-purple-500 to-purple-600" },
  { key: "memory", label: "Memory", icon: Brain, color: "from-blue-500 to-blue-600" },
  { key: "socialCognition", label: "Social", icon: Users, color: "from-green-500 to-green-600" },
  { key: "readingPhonics", label: "Reading", icon: BookOpen, color: "from-yellow-500 to-orange-500" },
  { key: "sensoryProcessing", label: "Senses", icon: ShieldAlert, color: "from-pink-500 to-pink-600" },
];

function StarRating({ value }: { value: number }) {
  const stars = Math.round(Math.min(5, value * 5));
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export default function Home() {
  const { data: progress, isLoading: isLoadingProgress } = useGetProgress({
    query: { queryKey: getGetProgressQueryKey() },
  });
  const { data: recommendation, isLoading: isLoadingRec } = useGetGameRecommendation({
    query: { queryKey: getGetGameRecommendationQueryKey() },
  });
  const { data: gameProgress, isLoading: isLoadingGames } = useGetProgressByGame({
    query: { queryKey: getGetProgressByGameQueryKey() },
  });

  const hasPlayed = (progress?.totalSessions ?? 0) > 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg shadow-primary/20">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight">Hey Explorer! 👋</h1>
            {hasPlayed ? (
              <p className="text-base opacity-90 font-medium">
                You're on a <span className="font-black">{progress?.currentStreak}-day</span> streak — amazing!
              </p>
            ) : (
              <p className="text-base opacity-90 font-medium">Ready for your first brain workout?</p>
            )}
            {hasPlayed && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1 backdrop-blur-sm text-sm">
                  <Flame className="h-4 w-4 text-orange-300" />
                  <span className="font-bold">{progress?.currentStreak} day streak</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1 backdrop-blur-sm text-sm">
                  <Trophy className="h-4 w-4 text-yellow-300" />
                  <span className="font-bold">{progress?.totalSessions} games played</span>
                </div>
              </div>
            )}
          </div>
          <Brain className="h-20 w-20 opacity-60 shrink-0" />
        </div>
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      </section>

      {/* Play Next */}
      <section>
        <h2 className="mb-3 text-lg font-black flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" /> Play Next
        </h2>
        {isLoadingRec || !recommendation ? (
  <Skeleton className="h-28 w-full rounded-2xl" />
) : (
  <Card className="overflow-hidden border-2 border-accent/30 bg-accent/5">
    <CardContent className="p-0">
      <div className="flex items-center">
        <div className="flex flex-1 flex-col justify-center p-5 gap-2">
          <div className="inline-flex w-fit items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
            Recommended for you
          </div>

          <h3 className="text-xl font-black">
            {recommendation?.gameType ?? "Game"}
          </h3>

          <Link href={`/games/${recommendation?.gameType?.replace(/_/g, "-") ?? ""}`}>
            <Button size="sm">Play Now</Button>
          </Link>
        </div>
      </div>
    </CardContent>
  </Card>
)}
      </section>

      {/* Brain Skills */}
      <section>
        <h2 className="mb-3 text-lg font-black flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> My Brain Skills
        </h2>
        {isLoadingProgress ? (
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : hasPlayed && progress?.skillLevels ? (
          <div className="grid grid-cols-5 gap-2">
            {SKILL_INFO.map(({ key, label, icon: Icon, color }) => {
              const val = (progress.skillLevels as Record<string, number>)[key] ?? 0;
              const pct = Math.round(val);
              return (
                <div key={key} className={`flex flex-col items-center justify-center gap-1 rounded-xl bg-gradient-to-br ${color} p-3 text-white shadow-md`}>
                  <Icon className="h-5 w-5 opacity-90" />
                  <span className="text-xl font-black">{pct}%</span>
                  <span className="text-xs font-bold opacity-80">{label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <Brain className="h-10 w-10 text-primary/40" />
              <p className="text-base font-black text-foreground">Start playing to see your skills!</p>
              <p className="text-sm text-muted-foreground font-medium">Each game trains a different part of your brain.</p>
              <Link href="/games">
                <Button size="sm" className="mt-1 rounded-xl font-bold">
                  <Gamepad2 className="mr-1.5 h-4 w-4" /> Browse Games
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Games I've Played */}
      {hasPlayed && (
        <section>
          <h2 className="mb-3 text-lg font-black flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Games I've Played
          </h2>
          {isLoadingGames ? (
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {(gameProgress ?? [])
                .filter((g) => g.sessionsPlayed > 0)
                .map((g) => (
                  <Link key={g.gameType} href={`/games/${g.gameType.replace(/_/g, "-")}`}>
                    <div className="flex flex-col items-center gap-1 rounded-xl border-2 border-border/60 bg-card p-3 text-center transition-all hover:border-primary/40 hover:shadow-md cursor-pointer">
                      <span className="text-2xl">{GAME_ICONS[g.gameType] ?? "🎮"}</span>
                      <span className="text-xs font-bold text-foreground leading-tight line-clamp-1">
                        {GAME_LABELS[g.gameType] ?? g.gameType}
                      </span>
                      <StarRating value={g.averageAccuracy / 100} />
                      <span className="text-xs text-muted-foreground">{g.sessionsPlayed}x</span>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
