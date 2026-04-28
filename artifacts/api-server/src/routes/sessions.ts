import { Router, type IRouter } from "express";
import { desc, eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  sessionsTable,
  leaderboardTable,
  userProfileTable,
  usersTable,
} from "@workspace/db";
import {
  CreateSessionBody,
  GetSessionParams,
  GetSessionResponse,
  ListSessionsQueryParams,
  ListSessionsResponse,
  UpdateSessionBody,
  UpdateSessionParams,
  UpdateSessionResponse,
} from "@workspace/api-zod";
import { broadcast } from "../lib/realtime";

const router: IRouter = Router();

function stripNulls(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v])
  );
}

const ExtendedCreateSessionBody = CreateSessionBody.extend({
  userId: z.number().int().positive().optional(),
});

router.get("/sessions", async (req, res): Promise<void> => {
  const parsed = ListSessionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { gameType, limit = 20 } = parsed.data;
  const userId = req.query.userId ? Number(req.query.userId) : undefined;

  const conditions = [];
  if (gameType) conditions.push(eq(sessionsTable.gameType, gameType));
  if (Number.isFinite(userId)) conditions.push(eq(sessionsTable.userId, userId as number));

  const results = await db
    .select()
    .from(sessionsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(sessionsTable.startedAt))
    .limit(limit ?? 20);

  res.json(ListSessionsResponse.parse(results.map(stripNulls)));
});

router.post("/sessions", async (req, res): Promise<void> => {
  const parsed = ExtendedCreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(sessionsTable)
    .values({
      gameType: parsed.data.gameType,
      difficulty: parsed.data.difficulty ?? 1,
      userId: parsed.data.userId ?? null,
    })
    .returning();

  res.status(201).json(GetSessionResponse.parse(stripNulls(session)));
});

router.get("/sessions/:id", async (req, res): Promise<void> => {
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, params.data.id));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(GetSessionResponse.parse(stripNulls(session)));
});

router.patch("/sessions/:id", async (req, res): Promise<void> => {
  const params = UpdateSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.score !== undefined) updateData.score = parsed.data.score;
  if (parsed.data.accuracy !== undefined) updateData.accuracy = parsed.data.accuracy;
  if (parsed.data.reactionTimeMs !== undefined) updateData.reactionTimeMs = parsed.data.reactionTimeMs;
  if (parsed.data.wrongClicks !== undefined) updateData.wrongClicks = parsed.data.wrongClicks;
  if (parsed.data.missedSignals !== undefined) updateData.missedSignals = parsed.data.missedSignals;
  if (parsed.data.attentionDuration !== undefined) updateData.attentionDuration = parsed.data.attentionDuration;
  if (parsed.data.hesitationCount !== undefined) updateData.hesitationCount = parsed.data.hesitationCount;
  if (parsed.data.completedAt !== undefined) updateData.completedAt = new Date(parsed.data.completedAt);
  if (parsed.data.adaptiveFlags !== undefined) updateData.adaptiveFlags = parsed.data.adaptiveFlags;

  const [session] = await db
    .update(sessionsTable)
    .set(updateData)
    .where(eq(sessionsTable.id, params.data.id))
    .returning();

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // If session was just completed, write to leaderboard, update profile, broadcast
  if (session.completedAt && session.userId && typeof session.score === "number") {
    try {
      await db.insert(leaderboardTable).values({
        userId: session.userId,
        gameType: session.gameType,
        score: session.score,
        accuracy: Math.round(session.accuracy ?? 0),
        difficulty: session.difficulty,
      });

      // Bump profile counters
      await db
        .update(userProfileTable)
        .set({
          totalGamesPlayed: sql`${userProfileTable.totalGamesPlayed} + 1`,
          totalStars: sql`${userProfileTable.totalStars} + ${Math.max(0, Math.round(session.score / 10))}`,
          updatedAt: new Date(),
        })
        .where(eq(userProfileTable.userId, session.userId));

      // Fetch user and broadcast
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
      broadcast("leaderboard", "entry", {
        userId: session.userId,
        userName: user?.name ?? "Player",
        avatarEmoji: user?.avatarEmoji ?? "🌟",
        gameType: session.gameType,
        score: session.score,
        accuracy: Math.round(session.accuracy ?? 0),
        difficulty: session.difficulty,
        achievedAt: new Date().toISOString(),
      });
    } catch (e) {
      // Non-fatal: log and continue
      console.error("[leaderboard write] failed", e);
    }
  }

  res.json(UpdateSessionResponse.parse(stripNulls(session)));
});

export default router;
