import { Router, type IRouter } from "express";
import { desc, eq, sql, and } from "drizzle-orm";
import { db, leaderboardTable, usersTable, sessionsTable } from "@workspace/db";
import { subscribe } from "../lib/realtime";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const gameType = typeof req.query.gameType === "string" ? req.query.gameType : undefined;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);

  const baseSelect = db
    .select({
      id: leaderboardTable.id,
      userId: leaderboardTable.userId,
      userName: usersTable.name,
      avatarEmoji: usersTable.avatarEmoji,
      gameType: leaderboardTable.gameType,
      score: leaderboardTable.score,
      accuracy: leaderboardTable.accuracy,
      difficulty: leaderboardTable.difficulty,
      achievedAt: leaderboardTable.achievedAt,
    })
    .from(leaderboardTable)
    .leftJoin(usersTable, eq(leaderboardTable.userId, usersTable.id));

  const rows = gameType
    ? await baseSelect
        .where(eq(leaderboardTable.gameType, gameType))
        .orderBy(desc(leaderboardTable.score), desc(leaderboardTable.achievedAt))
        .limit(limit)
    : await baseSelect
        .orderBy(desc(leaderboardTable.score), desc(leaderboardTable.achievedAt))
        .limit(limit);

  res.json({ entries: rows });
});

router.get("/leaderboard/top-by-game", async (_req, res): Promise<void> => {
  // For each gameType, return top 5 entries with user info.
  const games = await db
    .selectDistinct({ gameType: leaderboardTable.gameType })
    .from(leaderboardTable);

  const result: Record<string, unknown[]> = {};
  for (const g of games) {
    const top = await db
      .select({
        userId: leaderboardTable.userId,
        userName: usersTable.name,
        avatarEmoji: usersTable.avatarEmoji,
        score: leaderboardTable.score,
        accuracy: leaderboardTable.accuracy,
        difficulty: leaderboardTable.difficulty,
        achievedAt: leaderboardTable.achievedAt,
      })
      .from(leaderboardTable)
      .leftJoin(usersTable, eq(leaderboardTable.userId, usersTable.id))
      .where(eq(leaderboardTable.gameType, g.gameType))
      .orderBy(desc(leaderboardTable.score))
      .limit(5);
    result[g.gameType] = top;
  }
  res.json({ games: result });
});

router.get("/leaderboard/stream", async (_req, res): Promise<void> => {
  subscribe(res, "leaderboard");
});

export default router;
