import Anthropic from "@anthropic-ai/sdk";

export const HOOK_CATEGORIES = [
  "question",
  "bold-claim",
  "controversy",
  "listicle",
  "story",
  "stat",
  "cta-challenge",
  "other",
] as const;

export type HookCategory = (typeof HOOK_CATEGORIES)[number];

let client: Anthropic | null = null;

function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/** Categorize a batch of hooks in one call to keep token cost low. */
export async function categorizeHooks(
  hooks: { id: string; hook: string }[]
): Promise<Record<string, HookCategory>> {
  if (hooks.length === 0) return {};

  const list = hooks.map((h) => `${h.id}: ${h.hook}`).join("\n");

  const message = await getClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Kategorisiere jeden Instagram-Hook (erste Zeile der Caption) in genau eine dieser Kategorien: ${HOOK_CATEGORIES.join(", ")}.

Antworte NUR mit JSON im Format {"<id>": "<kategorie>", ...}, keine Erklärung.

Hooks:
${list}`,
      },
    ],
  });

  const text = message.content.find((c) => c.type === "text")?.text ?? "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {};
  }
}
