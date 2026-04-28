import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, usersTable, userProfileTable, sessionsTable } from "@workspace/db";

const router: IRouter = Router();

const UpsertUserBody = z.object({
  name: z.string().trim().min(1).max(100),
  avatarEmoji: z.string().max(16).optional(),
});

router.post("/users/upsert", async (req, res): Promise<void> => {
  const parsed = UpsertUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, avatarEmoji } = parsed.data;

  // Check if user exists
  const existing = await db.select().from(usersTable).where(eq(usersTable.name, name));
  let user = existing[0];

  if (!user) {
    // INSERT (no returning in MySQL)
    await db.insert(usersTable).values({
      name,
      avatarEmoji: avatarEmoji ?? "🌟",
    });

    const [createdUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.name, name))
      .limit(1);

    user = createdUser;

    // create profile if not exists
    const existingProfile = await db
      .select()
      .from(userProfileTable)
      .where(eq(userProfileTable.userId, user.id));

    if (existingProfile.length === 0) {
      await db.insert(userProfileTable).values({ userId: user.id });
    }
  } else {
    // UPDATE (no returning)
    await db
      .update(usersTable)
      .set({
        lastSeenAt: new Date(),
        ...(avatarEmoji ? { avatarEmoji } : {}),
      })
      .where(eq(usersTable.id, user.id));

    const [updatedUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    user = updatedUser;
  }

  res.json({ user });
});

router.get("/users/:id/profile", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  let [profile] = await db
    .select()
    .from(userProfileTable)
    .where(eq(userProfileTable.userId, id));

  if (!profile) {
    await db.insert(userProfileTable).values({ userId: id });

    const [createdProfile] = await db
      .select()
      .from(userProfileTable)
      .where(eq(userProfileTable.userId, id))
      .limit(1);

    profile = createdProfile;
  }

  // MySQL-compatible stats
  const stats = await db
    .select({
      totalGames: sql<number>`count(*)`,
      totalScore: sql<number>`coalesce(sum(${sessionsTable.score}),0)`,
      avgAccuracy: sql<number>`coalesce(avg(${sessionsTable.accuracy}),0)`,
    })
    .from(sessionsTable)
    .where(eq(sessionsTable.userId, id));

  res.json({
    user,
    profile: profile ?? null,
    stats: stats[0] ?? { totalGames: 0, totalScore: 0, avgAccuracy: 0 },
  });
});

export default router;