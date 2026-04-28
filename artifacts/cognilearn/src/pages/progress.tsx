import {
  useGetProgressByGame,
  getGetProgressByGameQueryKey,
  useGetProgress,
  getGetProgressQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Trophy, Flame, Brain, Gamepad2 } from "lucide-react";
import { Link } from "wouter";

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

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  const stars = Math.round(Math.min(max, value * max));
  return (
    <div className="flex gap-0.5 justify-center">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/25"
          }`}
        />
      ))}
    </div>
  );
}

function TrendBadge({ trend }: { trend: string }) {
  if (trend === "improving") return <span className="text-xs font-bold text-green-600 bg-green-100 rounded-full px-2 py-0.5">Getting better!</span>;
  if (trend === "declining") return <span className="text-xs font-bold text-orange-600 bg-orange-100 rounded-full px-2 py-0.5">Keep trying!</span>;
  return <span className="text-xs font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">Steady</span>;
}

export default function Progress() {
  const { data: progressByGame, isLoading: isLoadingGames } = useGetProgressByGame({
    query: { queryKey: getGetProgressByGameQueryKey() },
  });

  const { data: summary, isLoading: isLoadingSummary } = useGetProgress({
    query: { queryKey: getGetProgressQueryKey() },
  });

  const hasPlayed = (summary?.totalSessions ?? 0) > 0;
  const games = Array.isArray(progressByGame)
  ? progressByGame
  : progressByGame?.data ?? [];

const playedGames = games.filter((g) => g.sessionsPlayed > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-primary p-3 shadow-lg">
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-foreground">My Progress</h1>
          <p className="text-lg font-medium text-muted-foreground">Look how far you've come!</p>
        </div>
      </div>

      {/* Big Stats — only shown if data exists */}
      {isLoadingSummary ? (
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : hasPlayed ? (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-4 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 shadow-md">
            <CardContent className="flex flex-col items-center justify-center p-6 gap-1">
              <Trophy className="h-8 w-8 text-primary" />
              <span className="text-5xl font-black text-primary">{summary?.totalSessions}</span>
              <span className="text-base font-bold text-muted-foreground">Games Played</span>
            </CardContent>
          </Card>
          <Card className="border-4 border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 shadow-md">
            <CardContent className="flex flex-col items-center justify-center p-6 gap-1">
              <Flame className="h-8 w-8 text-accent" />
              <span className="text-5xl font-black text-accent">{summary?.currentStreak}</span>
              <span className="text-base font-bold text-muted-foreground">Day Streak</span>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Game Cards */}
      <section>
        <h2 className="mb-4 text-2xl font-black flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-500" /> My Game Scores
        </h2>

        {isLoadingGames ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : !hasPlayed ? (
          <Card className="border-2 border-dashed border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <Brain className="h-16 w-16 text-primary/40" />
              <p className="text-2xl font-black text-foreground">No scores yet!</p>
              <p className="text-muted-foreground font-medium text-lg">
                Play your first game to start earning stars.
              </p>
              <Link href="/games">
                <Button size="lg" className="mt-2 rounded-xl font-bold text-base">
                  <Gamepad2 className="mr-2 h-5 w-5" /> Let's Play!
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {games.map((game) => {
              const played = game.sessionsPlayed > 0;
              return (
                <Link key={game.gameType} href={`/games/${game.gameType.replace(/_/g, "-")}`}>
                  <div
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all cursor-pointer hover-elevate ${
                      played
                        ? "border-border bg-card hover:border-primary/40 hover:shadow-md"
                        : "border-dashed border-muted-foreground/20 bg-muted/30 opacity-60"
                    }`}
                    data-testid={`card-game-${game.gameType}`}
                  >
                    <span className="text-4xl">{GAME_ICONS[game.gameType] ?? "🎮"}</span>
                    <span className="text-sm font-bold text-foreground leading-tight">
                      {GAME_LABELS[game.gameType] ?? game.gameType}
                    </span>
                    {played ? (
                      <>
                        <StarRating value={game.averageAccuracy / 100} />
                        <span className="text-2xl font-black text-primary">{game.bestScore}</span>
                        <span className="text-xs text-muted-foreground font-medium">best score</span>
                        <TrendBadge trend={game.trendDirection} />
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground font-bold mt-1">Not played yet</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
