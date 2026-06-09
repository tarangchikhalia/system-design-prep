import { Router, Request, Response } from 'express';
import db from '../db';
import { client } from '../shared/openai';

const router = Router();

type ChallengeContext = {
  description: string;
  difficulty: string;
  topics: string[];
};

type ChatBody = {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  challengeContext?: ChallengeContext;
  sessionId?: number;
  diagram?: string;
};

router.post('/sessions', (req: Request, res: Response) => {
  const { challengeId } = req.body as { challengeId?: number };
  if (!challengeId) {
    res.status(400).json({ error: 'challengeId is required' });
    return;
  }
  const result = db
    .prepare('INSERT INTO sessions (challenge_id, started_at) VALUES (?, ?)')
    .run(challengeId, new Date().toISOString());
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

router.patch('/sessions/:id/end', (req: Request, res: Response) => {
  const id = parseInt(String(req.params['id']), 10);
  const result = db
    .prepare('UPDATE sessions SET ended_at = ? WHERE id = ? AND ended_at IS NULL')
    .run(new Date().toISOString(), id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Session not found or already ended' });
    return;
  }
  res.status(200).json({ ok: true });
});

router.post('/chat', async (req: Request, res: Response) => {
  const { message, history = [], challengeContext, sessionId, diagram } = req.body as ChatBody;

  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const systemContent = challengeContext
    ? `You are an expert system design interviewer. The candidate is working on the following challenge:\n\n**Challenge**: ${challengeContext.description}\n**Difficulty**: ${challengeContext.difficulty}\n**Topics**: ${challengeContext.topics.join(', ')}\n\nYour role:\n- Ask clarifying questions to probe the candidate's thinking\n- Challenge assumptions and push for deeper reasoning\n- Evaluate proposed solutions and point out trade-offs\n- When the candidate shares a diagram (JSON format), analyze the architecture it represents\n- Be rigorous but constructive — this is a learning environment`
    : 'You are an expert system design interviewer. Be rigorous but constructive.';

  const userContent = diagram ? `${message}\n\n[Diagram JSON]:\n${diagram}` : message;

  const openAiMessages = [
    { role: 'system' as const, content: systemContent },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userContent },
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';

  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: openAiMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? '';
      if (token) {
        fullResponse += token;
        res.write(`data: ${token}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

    if (sessionId) {
      const hasDiagram = diagram ? 1 : 0;
      const insertMsg = db.prepare(
        'INSERT INTO messages (session_id, role, content, has_diagram, created_at) VALUES (?, ?, ?, ?, ?)'
      );
      db.transaction(() => {
        insertMsg.run(sessionId, 'user', message, hasDiagram, new Date().toISOString());
        insertMsg.run(sessionId, 'assistant', fullResponse, 0, new Date().toISOString());
      })();
    }
  } catch (err) {
    console.error('chat error:', err);
    res.write('data: [ERROR]\n\n');
    res.end();
  }
});

export default router;
