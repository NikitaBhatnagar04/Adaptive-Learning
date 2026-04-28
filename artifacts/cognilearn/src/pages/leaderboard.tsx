import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Medal, Star, Wifi, WifiOff } from "lucide-react";
import { getLeaderboard, type LeaderboardEntry, getCurrentUserId } from "@/lib/api-extra";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  letter_recognition: "Letter Hunt",
  pattern_recognition: "Pattern Power",
  sequencing_task: "In Order, Please!",
  audio_word_match: "Hear It, Pick It",
  speech_echo: "Say It Right",
  mirror_match: "Mirror Mirror",
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<string>("all");
  const [connected, setConnected] = useState(false);
  const [pulseId, setPulseId] = useState<number | null>(null);
  const myId = getCurrentUserId();

  // Initial load + tab refresh
  useEffect(() => {
    let cancelled = false;
    getLeaderboard({ gameType: tab === "all" ? undefined : tab, limit: 25 })
      .then((data) => {
        if (!cancelled) setEntries(data.entries);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tab]);

  // Live SSE subscription
  useEffect(() => {
    const es = new EventSource("/api/leaderboard/stream");
    es.addEventListener("ready", () => setConnected(true));
    es.addEventListener("entry", (ev: MessageEvent) => {
      try {
        const e = JSON.parse(ev.data) as LeaderboardEntry;
        if (tab !== "all" && e.gameType !== tab) return;
        setEntries((prev) => {
          const next = [...prev, e].sort((a, b) =>
            b.score - a.score || (b.achievedAt > a.achievedAt ? 1 : -1)
          );
          return next.slice(0, 25);
        });
        setPulseId(e.userId);
        setTimeout(() => setPulseId(null), 1500);
      } catch {}
    });
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, [tab]);

  const tabs = useMemo(() => {
    const seen = new Set<string>(["all", "letter_recognition", "pattern_recognition", "sequencing_task", "audio_word_match", "speech_echo"]);
    entries.forEach((e) => seen.add(e.gameType));
    return Array.from(seen);
  }, [entries]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-yellow-100 p-3 shadow-md">
          <Trophy className="h-8 w-8 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-black text-foreground">Leaderboard</h1>
          <p className="text-lg font-medium text-muted-foreground">
            Top scores update in real time
          </p>
        </div>
        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
          connected ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
        }`}>
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connected ? "Live" : "Offline"}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-2xl">
          <TabsTrigger value="all" className="rounded-xl font-bold">All Games</TabsTrigger>
          {tabs.filter((t) => t !== "all").map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-xl font-bold">
              {GAME_LABELS[t] ?? t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          <Card className="border-2 shadow-lg">
            <CardContent className="p-4 md:p-6">
              {entries.length === 0 ? (
                <div className="text-center py-16">
                  <Trophy className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-bold text-muted-foreground">No scores yet — be the first!</p>
                </div>
              ) : (
                <ol className="space-y-2">
                  <AnimatePresence initial={false}>
                    {entries.map((e, i) => {
                      const isMe = myId !== null && e.userId === myId;
                      const pulse = pulseId === e.userId;
                      return (
                        <motion.li
                          key={`${e.userId}-${e.achievedAt}`}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            scale: pulse ? [1, 1.03, 1] : 1,
                          }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ type: "spring", stiffness: 300, damping: 24 }}
                          className={`flex items-center gap-4 px-4 py-3 rounded-2xl border-2 ${
                            isMe ? "bg-primary/10 border-primary" : "bg-card border-muted"
                          }`}
                        >
                          <div className="w-10 text-center">
                            {i === 0 && <Crown className="h-7 w-7 text-yellow-500 mx-auto" />}
                            {i === 1 && <Medal className="h-7 w-7 text-slate-400 mx-auto" />}
                            {i === 2 && <Medal className="h-7 w-7 text-amber-700 mx-auto" />}
                            {i > 2 && <span className="text-xl font-black text-muted-foreground">#{i + 1}</span>}
                          </div>
                          <div className="text-3xl">{e.avatarEmoji ?? "🌟"}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-lg truncate">
                              {e.userName ?? "Player"}
                              {isMe && <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">YOU</span>}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground">
                              {GAME_LABELS[e.gameType] ?? e.gameType} · Lvl {e.difficulty}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-primary flex items-center gap-1 justify-end">
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /> {e.score}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground">{e.accuracy}% accurate</p>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
