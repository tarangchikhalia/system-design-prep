import { Router, Request, Response } from "express";
import {
  listChallenges,
  generateChallenge,
  getChallenge,
  updateChallenge,
  deleteChallenge,
  IncompleteAIResponseError,
} from "../services/challenge/challenge";

const router = Router();

router.get("/challenges", (req: Request, res: Response) => {
  const page = Math.max(1, parseInt((req.query["page"] as string) || "1", 10));
  const limit = Math.max(
    1,
    Math.min(50, parseInt((req.query["limit"] as string) || "10", 10)),
  );
  const difficulty = req.query["difficulty"] as string | undefined;
  const topic = req.query["topic"] as string | undefined;

  res.json(listChallenges({ page, limit, difficulty, topic }));
});

router.post("/generate-challenge", async (req: Request, res: Response) => {
  const { prompt: challenge_description } = req.body as { prompt?: string };

  if (!challenge_description) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  try {
    const created = await generateChallenge(challenge_description);
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof IncompleteAIResponseError) {
      res.status(502).json({ error: "AI returned an incomplete challenge structure" });
    } else {
      console.error("generate-challenge error:", err);
      res.status(502).json({ error: "Failed to generate challenge from AI" });
    }
  }
});

router.get("/challenges/:id", (req: Request, res: Response) => {
  const id = parseInt(String(req.params["id"]), 10);
  const challenge = getChallenge(id);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }
  res.json(challenge);
});

router.put("/challenges/:id", (req: Request, res: Response) => {
  const id = parseInt(String(req.params["id"]), 10);
  const updates = req.body as Partial<{
    challenge_name: string;
    description: string;
    difficulty: string;
    topics: string[];
  }>;

  const updated = updateChallenge(id, updates);
  if (!updated) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }
  res.json(updated);
});

router.delete("/challenges/:id", (req: Request, res: Response) => {
  const id = parseInt(String(req.params["id"]), 10);
  const deleted = deleteChallenge(id);
  if (!deleted) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }
  res.status(204).send();
});

export default router;
