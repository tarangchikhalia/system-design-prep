import { Router, Request, Response } from "express";
import {
  createSession,
  endSession,
  streamChat,
  ChallengeContext,
} from "../services/chat/chat";

const router = Router();

type ChatBody = {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  challengeContext?: ChallengeContext;
  sessionId?: number;
  diagram?: string;
};

router.post("/sessions", (req: Request, res: Response) => {
  const { challengeId } = req.body as { challengeId?: number };
  if (!challengeId) {
    res.status(400).json({ error: "challengeId is required" });
    return;
  }
  res.status(201).json({ id: createSession(challengeId) });
});

router.patch("/sessions/:id/end", (req: Request, res: Response) => {
  const id = parseInt(String(req.params["id"]), 10);
  if (!endSession(id)) {
    res.status(404).json({ error: "Session not found or already ended" });
    return;
  }
  res.status(200).json({ ok: true });
});

router.post("/chat", async (req: Request, res: Response) => {
  const { message, history = [], challengeContext, sessionId, diagram } =
    req.body as ChatBody;

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await streamChat({
      message,
      history,
      challengeContext,
      sessionId,
      diagram,
      onToken: (token) => {
        res.write(`data: ${token.replace(/\n/g, "\\n")}\n\n`);
      },
    });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("chat error:", err);
    res.write("data: [ERROR]\n\n");
    res.end();
  }
});

export default router;
