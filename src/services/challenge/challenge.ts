import { client } from "../../shared/openai";
import db from "../../db";

export type ChallengeRow = {
  id: number;
  challenge_name: string;
  description: string;
  difficulty: string;
  topics: string;
};

export type Challenge = {
  id: number;
  challenge_name: string;
  description: string;
  difficulty: string;
  topics: string[];
};

export class IncompleteAIResponseError extends Error {
  constructor() {
    super("AI returned an incomplete challenge structure");
  }
}

export function parseTopics(row: ChallengeRow): Challenge {
  return { ...row, topics: JSON.parse(row.topics) as string[] };
}

export function listChallenges(params: {
  page: number;
  limit: number;
  difficulty?: string;
  topic?: string;
}): { data: Challenge[]; total: number; page: number; totalPages: number } {
  const { page, limit, difficulty, topic } = params;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const filterParams: string[] = [];

  if (difficulty) {
    conditions.push("difficulty = ?");
    filterParams.push(difficulty);
  }
  if (topic) {
    conditions.push("topics LIKE ?");
    filterParams.push(`%${topic}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = (
    db
      .prepare(`SELECT COUNT(*) as count FROM challenges ${where}`)
      .get(filterParams) as { count: number }
  ).count;

  const rows = db
    .prepare(
      `SELECT * FROM challenges ${where} ORDER BY id ASC LIMIT ? OFFSET ?`,
    )
    .all([...filterParams, limit, offset]) as ChallengeRow[];

  return {
    data: rows.map(parseTopics),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export const create_challenge = async (
  challenge_description: string,
): Promise<{
  challenge_name: string;
  description: string;
  difficulty: string;
  topics: string[];
}> => {
  const system_content = `You are an expert software engineer. \
      Your task is to create a system design interview question \
      based on the short description provided by the user. \
      Respond with a JSON object with these exact fields: \
      challenge_name (string), description (string including Overview, Detailed description and Constraints), \
      difficulty (one of: easy, medium, hard), topics (array of strings). \
      Output only valid JSON with no markdown or code fences.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: system_content },
      { role: "user", content: challenge_description },
    ],
  });

  const content = response.choices[0].message.content ?? "";
  return JSON.parse(content) as {
    challenge_name: string;
    description: string;
    difficulty: string;
    topics: string[];
  };
};

export async function generateChallenge(prompt: string): Promise<Challenge> {
  const challenge = await create_challenge(prompt);
  const { challenge_name, description, difficulty, topics } = challenge;

  if (!challenge_name || !description || !difficulty || !Array.isArray(topics)) {
    throw new IncompleteAIResponseError();
  }

  const result = db
    .prepare(
      "INSERT INTO challenges (challenge_name, description, difficulty, topics) VALUES (?, ?, ?, ?)",
    )
    .run(challenge_name, description, difficulty, JSON.stringify(topics));

  const created = db
    .prepare("SELECT * FROM challenges WHERE id = ?")
    .get(result.lastInsertRowid) as ChallengeRow;

  return parseTopics(created);
}

export function getChallenge(id: number): Challenge | null {
  const row = db
    .prepare("SELECT * FROM challenges WHERE id = ?")
    .get(id) as ChallengeRow | undefined;
  return row ? parseTopics(row) : null;
}

export function updateChallenge(
  id: number,
  updates: Partial<{
    challenge_name: string;
    description: string;
    difficulty: string;
    topics: string[];
  }>,
): Challenge | null {
  const existing = db
    .prepare("SELECT * FROM challenges WHERE id = ?")
    .get(id) as ChallengeRow | undefined;

  if (!existing) return null;

  const updated = {
    challenge_name: updates.challenge_name ?? existing.challenge_name,
    description: updates.description ?? existing.description,
    difficulty: updates.difficulty ?? existing.difficulty,
    topics:
      updates.topics !== undefined
        ? JSON.stringify(updates.topics)
        : existing.topics,
  };

  db.prepare(
    "UPDATE challenges SET challenge_name = ?, description = ?, difficulty = ?, topics = ? WHERE id = ?",
  ).run(
    updated.challenge_name,
    updated.description,
    updated.difficulty,
    updated.topics,
    id,
  );

  const row = db
    .prepare("SELECT * FROM challenges WHERE id = ?")
    .get(id) as ChallengeRow;
  return parseTopics(row);
}

export function deleteChallenge(id: number): boolean {
  const result = db.prepare("DELETE FROM challenges WHERE id = ?").run(id);
  return result.changes > 0;
}
