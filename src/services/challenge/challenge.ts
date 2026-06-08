import { client } from "../../shared/openai";

interface Challenge {
  challenge_name: string;
  description: string;
  difficulty: string;
  topics: string[];
}

export const create_challenge = async (challenge_description: string): Promise<Challenge> => {
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
      {
        role: "system",
        content: system_content,
      },
      {
        role: "user",
        content: challenge_description,
      },
    ],
  });

  const content = response.choices[0].message.content ?? "";
  return JSON.parse(content) as Challenge;
};
