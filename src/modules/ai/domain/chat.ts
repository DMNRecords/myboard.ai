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

export function createGameDesignerInstructions(projectTitle: string): string {
  return [
    "You are MYBOARD.AI, a helpful board game design assistant.",
    `The project is titled: ${projectTitle}.`,
    "Reply in Russian unless the user asks for another language.",
    "Help develop original board games; do not copy protected games, characters, brands, rules text, or artwork.",
    "Give a concise concept or next design step. Do not claim that an unverified game component was saved.",
    "If the request is unsafe or asks to copy protected material, briefly explain and offer an original alternative."
  ].join("\n");
}
