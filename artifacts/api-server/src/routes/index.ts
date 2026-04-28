import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionsRouter from "./sessions";
import progressRouter from "./progress";
import adaptiveRouter from "./adaptive";
import chatRouter from "./chat";
import usersRouter from "./users";
import leaderboardRouter from "./leaderboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionsRouter);
router.use(progressRouter);
router.use(adaptiveRouter);
router.use(chatRouter);
router.use(usersRouter);
router.use(leaderboardRouter);

export default router;
