import db from "../../db";
import { client } from "../../shared/openai";

export type ChallengeContext = {
  description: string;
  difficulty: string;
  topics: string[];
};

export function createSession(challengeId: number): number {
  const result = db
    .prepare("INSERT INTO sessions (challenge_id, started_at) VALUES (?, ?)")
    .run(challengeId, new Date().toISOString());
  return Number(result.lastInsertRowid);
}

export function endSession(id: number): boolean {
  const result = db
    .prepare(
      "UPDATE sessions SET ended_at = ? WHERE id = ? AND ended_at IS NULL",
    )
    .run(new Date().toISOString(), id);
  return result.changes > 0;
}

export async function streamChat(params: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  challengeContext?: ChallengeContext;
  sessionId?: number;
  diagram?: string;
  onToken: (token: string) => void;
}): Promise<void> {
  const { message, history, challengeContext, sessionId, diagram, onToken } =
    params;

  const systemContent = challengeContext
    ? `You are an expert system design interviewer. The candidate is working on the following challenge:\n\n**Challenge**: ${challengeContext.description}\n**Difficulty**: ${challengeContext.difficulty}\n**Topics**: ${challengeContext.topics.join(", ")}\n\nYour role:\n- Ask clarifying questions to probe the candidate's thinking\n- Challenge assumptions and push for deeper reasoning\n- Evaluate proposed solutions and point out trade-offs\n- When the candidate shares a diagram (JSON format), analyze the architecture it represents\n- Be rigorous but constructive — this is a learning environment`
    : "You are an expert system design interviewer. Be rigorous but constructive.";

  const userContent = diagram
    ? `${message}\n\n[Diagram JSON]:\n${diagram}`
    : message;

  const openAiMessages = [
    { role: "system" as const, content: systemContent },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userContent },
  ];

  let fullResponse = "";

  const stream = await client.chat.completions.create({
    model: "gpt-4o",
    messages: openAiMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content ?? "";
    if (token) {
      fullResponse += token;
      onToken(token);
    }
  }

  if (sessionId) {
    const hasDiagram = diagram ? 1 : 0;
    const insertMsg = db.prepare(
      "INSERT INTO messages (session_id, role, content, has_diagram, created_at) VALUES (?, ?, ?, ?, ?)",
    );
    db.transaction(() => {
      insertMsg.run(sessionId, "user", message, hasDiagram, new Date().toISOString());
      insertMsg.run(sessionId, "assistant", fullResponse, 0, new Date().toISOString());
    })();
  }
}
