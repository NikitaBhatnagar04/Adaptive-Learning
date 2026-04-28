import { Router, type IRouter } from "express";
import { desc, sql, isNotNull } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";
import {
  GetProgressResponse,
  GetProgressByGameResponse,
  GetRecentActivityQueryParams,
  GetRecentActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/progress", async (req, res): Promise<void> => {
  const allSessions = await db
    .select()
    .from(sessionsTable)
    .where(isNotNull(sessionsTable.completedAt));

  const totalSessions = allSessions.length;

  const totalMinutes = allSessions.reduce((acc, s) => {
    if (s.completedAt && s.startedAt) {
      return acc + (new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()) / 60000;
    }
    return acc;
  }, 0);

  const accuracies = allSessions.filter((s) => s.accuracy != null).map((s) => s.accuracy as number);
  const averageAccuracy = accuracies.length > 0
    ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
    : 0;

  const reactionTimes = allSessions.filter((s) => s.reactionTimeMs != null).map((s) => s.reactionTimeMs as number);
  const averageReactionTimeMs = reactionTimes.length > 0
    ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
    : 0;

  // Calculate streak (consecutive days with sessions)
  const sessionDates = new Set(
    allSessions.map((s) => new Date(s.startedAt).toDateString())
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (sessionDates.has(d.toDateString())) {
      streak++;
    } else {
      break;
    }
  }

  // Compute skill levels per domain
  const attentionGames = ["attention_response", "continuous_performance", "task_switching", "sensory_filtering"];
  const memoryGames = ["continuous_performance", "task_switching"];
  const socialGames = ["social_scenario", "emotion_recognition"];
  const readingGames = ["letter_sound", "word_formation", "visual_tracking", "highlighted_reading"];
  const sensoryGames = ["sensory_filtering", "visual_tracking"];

  const getSkillLevel = (games: string[]) => {
    const relevant = allSessions.filter((s) => games.includes(s.gameType) && s.accuracy != null);
    if (relevant.length === 0) return 0;
    const avg = relevant.reduce((a, s) => a + (s.accuracy as number), 0) / relevant.length;
    return Math.round(avg * 100) / 100;
  };

  const summary = {
    totalSessions,
    totalMinutes: Math.round(totalMinutes * 10) / 10,
    averageAccuracy: Math.round(averageAccuracy * 100) / 100,
    averageReactionTimeMs: Math.round(averageReactionTimeMs),
    currentStreak: streak,
    skillLevels: {
      attention: getSkillLevel(attentionGames),
      memory: getSkillLevel(memoryGames),
      socialCognition: getSkillLevel(socialGames),
      readingPhonics: getSkillLevel(readingGames),
      sensoryProcessing: getSkillLevel(sensoryGames),
    },
  };

  res.json(GetProgressResponse.parse(summary));
});

router.get("/progress/by-game", async (req, res): Promise<void> => {
  const allSessions = await db
    .select()
    .from(sessionsTable)
    .where(isNotNull(sessionsTable.completedAt));

  const gameTypes = [
    "attention_response",
    "continuous_performance",
    "task_switching",
    "letter_sound",
    "word_formation",
    "visual_tracking",
    "highlighted_reading",
    "social_scenario",
    "emotion_recognition",
    "sensory_filtering",
  ];

  const progressByGame = gameTypes.map((gameType) => {
    const gameSessions = allSessions.filter((s) => s.gameType === gameType);
    const sessionsPlayed = gameSessions.length;

    if (sessionsPlayed === 0) {
      return {
        gameType,
        sessionsPlayed: 0,
        averageScore: 0,
        averageAccuracy: 0,
        bestScore: 0,
        currentDifficulty: 1,
        trendDirection: "stable" as const,
      };
    }

    const scores = gameSessions.filter((s) => s.score != null).map((s) => s.score as number);
    const accuracies = gameSessions.filter((s) => s.accuracy != null).map((s) => s.accuracy as number);
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const averageAccuracy = accuracies.length > 0 ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length : 0;
    const currentDifficulty = gameSessions[gameSessions.length - 1]?.difficulty ?? 1;

    // Trend: compare last 3 vs previous 3 sessions
    let trendDirection: "improving" | "stable" | "declining" = "stable";
    if (accuracies.length >= 4) {
      const recent = accuracies.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const older = accuracies.slice(-6, -3).reduce((a, b) => a + b, 0) / Math.max(accuracies.slice(-6, -3).length, 1);
      if (recent > older + 0.05) trendDirection = "improving";
      else if (recent < older - 0.05) trendDirection = "declining";
    }

    return {
      gameType,
      sessionsPlayed,
      averageScore: Math.round(averageScore),
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      bestScore,
      currentDifficulty,
      trendDirection,
    };
  });

  res.json(GetProgressByGameResponse.parse(progressByGame));
});

router.get("/progress/recent-activity", async (req, res): Promise<void> => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = parsed.data.limit ?? 10;

  const recent = await db
    .select()
    .from(sessionsTable)
    .where(isNotNull(sessionsTable.completedAt))
    .orderBy(desc(sessionsTable.completedAt))
    .limit(limit);

  res.json(GetRecentActivityResponse.parse(recent));
});

export default router;
