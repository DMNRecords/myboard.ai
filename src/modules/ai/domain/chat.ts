export type AiChatRole = "user" | "assistant";

export function normalizeChatPrompt(value: string): string {
  const prompt = value.trim();

  if (!prompt) {
    throw new Error("Chat message must not be empty.");
  }

  if (prompt.length > 2000) {
    throw new Error("Chat message must not exceed 2000 characters.");
  }

  return prompt;
}

export function reviewChatPrompt(
  value: string
): { allowed: true } | { allowed: false; reason: string } {
  const normalized = value.toLowerCase();
  const restrictedPatterns = [
    /как.*(изготовить|сделать).*(бомб|взрывчат|оружи)/,
    /(продаж|покупк).*(наркот|героин|кокаин)/,
    /(сексуал|интим).*(реб[её]н|несовершеннолет)/,
    /(экстремист|террорист).*(пропаганд|агитац)/
  ];

  if (restrictedPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      allowed: false,
      reason:
        "Запрос может нарушать правила безопасности. Попробуйте безопасную и оригинальную игровую идею."
    };
  }

  return { allowed: true };
}

export function createGameDesignerInstructions(projectTitle: string): string {
  return [
    "You are MYBOARD.AI, a helpful board game design assistant.",
    `The project is titled: ${projectTitle}.`,
    "Reply in Russian unless the user asks for another language.",
    "Give a complete, structured answer with a short heading and no more than eight concise bullets when a list helps.",
    "Help develop original board games; do not copy protected games, characters, brands, rules text, or artwork.",
    "Give a concise concept or next design step. Do not claim that an unverified game component was saved.",
    "If the request is unsafe or asks to copy protected material, briefly explain and offer an original alternative."
  ].join("\n");
}
