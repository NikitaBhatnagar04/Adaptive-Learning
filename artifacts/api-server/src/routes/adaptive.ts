import { Router, type IRouter } from "express";
import { desc, isNotNull, eq, and } from "drizzle-orm";
import { db, sessionsTable, adaptiveSettingsTable } from "@workspace/db";
import {
  GetAdaptiveSettingsResponse,
  UpdateAdaptiveSettingsBody,
  GetGameRecommendationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseUserId(req: any): number | null {
  const v = req.query?.userId ?? req.body?.userId;
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function getOrCreateSettings(userId: number | null) {
  if (userId !== null) {
    const existing = await db
      .select()
      .from(adaptiveSettingsTable)
      .where(eq(adaptiveSettingsTable.userId, userId))
      .limit(1);
    if (existing.length > 0) return existing[0];
    const [created] = await db
      .insert(adaptiveSettingsTable)
      .values({ userId })
      .returning();
    return created;
  }
  // No userId: use the first row (legacy/global)
  const existing = await db.select().from(adaptiveSettingsTable).limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(adaptiveSettingsTable).values({}).returning();
  return created;
}

router.get("/adaptive/settings", async (req, res): Promise<void> => {
  const settings = await getOrCreateSettings(parseUserId(req));
  res.json(GetAdaptiveSettingsResponse.parse(settings));
});

router.patch("/adaptive/settings", async (req, res): Promise<void> => {
  const parsed = UpdateAdaptiveSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = parseUserId(req);
  const current = await getOrCreateSettings(userId);

  await db
    .update(adaptiveSettingsTable)
    .set(parsed.data)
    .where(eq(adaptiveSettingsTable.id, current.id));

  const [updated] = await db
    .select()
    .from(adaptiveSettingsTable)
    .where(eq(adaptiveSettingsTable.id, current.id));

  res.json(GetAdaptiveSettingsResponse.parse(updated));
});

router.get("/adaptive/recommend", async (req, res): Promise<void> => {
  const userId = parseUserId(req);
  const settings = await getOrCreateSettings(userId);

  const baseQuery = db
    .select()
    .from(sessionsTable)
    .orderBy(desc(sessionsTable.completedAt))
    .limit(20);

  const recentSessions = userId !== null
    ? await db
        .select()
        .from(sessionsTable)
        .where(and(isNotNull(sessionsTable.completedAt), eq(sessionsTable.userId, userId)))
        .orderBy(desc(sessionsTable.completedAt))
        .limit(20)
    : await db
        .select()
        .from(sessionsTable)
        .where(isNotNull(sessionsTable.completedAt))
        .orderBy(desc(sessionsTable.completedAt))
        .limit(20);

  const gameTypes = [
    "attention_response", "continuous_performance", "task_switching",
    "letter_sound", "word_formation", "visual_tracking",
    "highlighted_reading", "social_scenario", "emotion_recognition",
    "sensory_filtering", "letter_recognition", "pattern_recognition",
    "sequencing_task", "audio_word_match", "speech_echo",
  ];

  const gameCounts: Record<string, number> = {};
  for (const g of gameTypes) gameCounts[g] = 0;
  for (const s of recentSessions) {
    if (gameCounts[s.gameType] !== undefined) gameCounts[s.gameType]++;
  }

  let leastPlayed = gameTypes[0];
  let minCount = Infinity;
  for (const g of gameTypes) {
    if (gameCounts[g] < minCount) {
      minCount = gameCounts[g];
      leastPlayed = g;
    }
  }

  const lastFew = recentSessions.slice(0, 5);
  const accs = lastFew.filter((s) => s.accuracy != null).map((s) => s.accuracy as number);
  const avgAcc = accs.length > 0 ? accs.reduce((a, b) => a + b, 0) / accs.length : 0.5;

  let suggestedDifficulty = settings.currentDifficulty;
  let reason = `You haven't played ${leastPlayed.replace(/_/g, " ")} much. Let's practice it!`;
  let priority: "high" | "medium" | "low" = "medium";

  // Identify weakness: lowest accuracy game (recent)
  const perGameAcc: Record<string, number[]> = {};
  for (const s of recentSessions) {
    if (s.accuracy != null) {
      perGameAcc[s.gameType] = perGameAcc[s.gameType] ?? [];
      perGameAcc[s.gameType].push(s.accuracy as number);
    }
  }
  let weakestGame: string | null = null;
  let weakestAcc = Infinity;
  for (const [g, arr] of Object.entries(perGameAcc)) {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    if (avg < weakestAcc && arr.length >= 1) { weakestAcc = avg; weakestGame = g; }
  }
  if (weakestGame && weakestAcc < 60) {
    leastPlayed = weakestGame;
    reason = `Your ${weakestGame.replace(/_/g, " ")} score has dipped — let's strengthen it!`;
    priority = "high";
    suggestedDifficulty = Math.max(1, settings.currentDifficulty - 1);
  } else if (gameCounts["social_scenario"] < 2) {
    leastPlayed = "social_scenario";
    reason = "Social skills are essential. Let's practice a social scenario!";
    priority = "high";
  } else if (avgAcc > 85) {
    reason = `Great accuracy lately! Try a harder version of ${leastPlayed.replace(/_/g, " ")}.`;
    suggestedDifficulty = Math.min(5, settings.currentDifficulty + 1);
  } else if (avgAcc < 50) {
    reason = `Let's try an easier challenge to build confidence.`;
    suggestedDifficulty = Math.max(1, settings.currentDifficulty - 1);
    priority = "high";
  }

  res.json(GetGameRecommendationResponse.parse({
    gameType: leastPlayed,
    reason,
    priority,
    suggestedDifficulty,
  }));
});

export default router;
