import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

type ChallengeRow = {
  id: number;
  challenge_name: string;
  description: string;
  difficulty: string;
  topics: string;
};

function parseTopics(row: ChallengeRow) {
  return { ...row, topics: JSON.parse(row.topics) as string[] };
}

router.get('/challenges', (req: Request, res: Response) => {
  const page = Math.max(1, parseInt((req.query['page'] as string) || '1', 10));
  const limit = Math.max(1, Math.min(50, parseInt((req.query['limit'] as string) || '10', 10)));
  const offset = (page - 1) * limit;
  const difficulty = req.query['difficulty'] as string | undefined;
  const topic = req.query['topic'] as string | undefined;

  const conditions: string[] = [];
  const filterParams: string[] = [];

  if (difficulty) {
    conditions.push('difficulty = ?');
    filterParams.push(difficulty);
  }
  if (topic) {
    conditions.push('topics LIKE ?');
    filterParams.push(`%${topic}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM challenges ${where}`).get(filterParams) as { count: number }
  ).count;

  const rows = db
    .prepare(`SELECT * FROM challenges ${where} ORDER BY id ASC LIMIT ? OFFSET ?`)
    .all([...filterParams, limit, offset]) as ChallengeRow[];

  res.json({
    data: rows.map(parseTopics),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.post('/challenges', (req: Request, res: Response) => {
  const { challenge_name, description, difficulty, topics } = req.body as {
    challenge_name: string;
    description: string;
    difficulty: string;
    topics: string[];
  };

  if (!challenge_name || !description || !difficulty || !Array.isArray(topics)) {
    res.status(400).json({ error: 'challenge_name, description, difficulty, and topics are required' });
    return;
  }

  const result = db
    .prepare('INSERT INTO challenges (challenge_name, description, difficulty, topics) VALUES (?, ?, ?, ?)')
    .run(challenge_name, description, difficulty, JSON.stringify(topics));

  const created = db.prepare('SELECT * FROM challenges WHERE id = ?').get(result.lastInsertRowid) as ChallengeRow;
  res.status(201).json(parseTopics(created));
});

router.get('/challenges/:id', (req: Request, res: Response) => {
  const id = parseInt(String(req.params['id']), 10);
  const row = db.prepare('SELECT * FROM challenges WHERE id = ?').get(id) as ChallengeRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Challenge not found' });
    return;
  }
  res.json(parseTopics(row));
});

router.put('/challenges/:id', (req: Request, res: Response) => {
  const id = parseInt(String(req.params['id']), 10);
  const existing = db.prepare('SELECT * FROM challenges WHERE id = ?').get(id) as ChallengeRow | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Challenge not found' });
    return;
  }

  const { challenge_name, description, difficulty, topics } = req.body as Partial<{
    challenge_name: string;
    description: string;
    difficulty: string;
    topics: string[];
  }>;

  const updated = {
    challenge_name: challenge_name ?? existing.challenge_name,
    description: description ?? existing.description,
    difficulty: difficulty ?? existing.difficulty,
    topics: topics !== undefined ? JSON.stringify(topics) : existing.topics,
  };

  db.prepare(
    'UPDATE challenges SET challenge_name = ?, description = ?, difficulty = ?, topics = ? WHERE id = ?'
  ).run(updated.challenge_name, updated.description, updated.difficulty, updated.topics, id);

  const row = db.prepare('SELECT * FROM challenges WHERE id = ?').get(id) as ChallengeRow;
  res.json(parseTopics(row));
});

router.delete('/challenges/:id', (req: Request, res: Response) => {
  const id = parseInt(String(req.params['id']), 10);
  const result = db.prepare('DELETE FROM challenges WHERE id = ?').run(id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Challenge not found' });
    return;
  }

  res.status(204).send();
});

export default router;
