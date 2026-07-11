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

export type PostAnalysisInput = {
  id: string;
  hook: string | null;
  caption: string | null;
  media_type: string;
  like_count: number | null;
  comment_count: number | null;
  view_count: number | null;
};

export type PostAnalysisResult = {
  category: HookCategory;
  why: string;
};

/**
 * Analyze a batch of posts in one call (category + why-it-works) using tool
 * calling so the response is guaranteed structured JSON instead of free text
 * we'd have to regex out of the model's reply.
 */
export async function analyzePosts(
  posts: PostAnalysisInput[]
): Promise<Record<string, PostAnalysisResult>> {
  if (posts.length === 0) return {};

  const list = posts
    .map((p) => {
      const parts = [
        `id: ${p.id}`,
        `typ: ${p.media_type}`,
        `likes: ${p.like_count ?? "?"}`,
        `kommentare: ${p.comment_count ?? "?"}`,
        `views: ${p.view_count ?? "?"}`,
        `hook: ${p.hook ?? "(kein Hook)"}`,
        `caption: ${(p.caption ?? "").slice(0, 600)}`,
      ];
      return parts.join("\n");
    })
    .join("\n---\n");

  const tool: Anthropic.Tool = {
    name: "submit_analysis",
    description: "Liefert für jeden Post eine Hook-Kategorie und eine kurze Begründung.",
    input_schema: {
      type: "object",
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Die id des Posts, unverändert übernommen." },
              category: { type: "string", enum: [...HOOK_CATEGORIES] },
              why: {
                type: "string",
                description:
                  "1-2 Sätze auf Deutsch: was an Hook/Content das Publikum catcht und warum es (basierend auf den Zahlen) gut oder schlecht ankommt.",
              },
            },
            required: ["id", "category", "why"],
          },
        },
      },
      required: ["results"],
    },
  };

  const message = await getClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    tools: [tool],
    tool_choice: { type: "tool", name: "submit_analysis" },
    messages: [
      {
        role: "user",
        content: `Du analysierst Instagram-Postings für einen Content-Ersteller, der herausfinden will, welche Hooks/Themen bei einem Fitness-/Gesundheits-Publikum ziehen.

Für JEDEN der folgenden Posts (id nicht verändern, für alle IDs einen Eintrag liefern):
1. Ordne den Hook einer Kategorie zu: ${HOOK_CATEGORIES.join(", ")}.
2. Schreib 1-2 Sätze auf Deutsch, was am Hook/Content das Publikum catcht (Neugier-Lücke, Kontroverse, Persönliches, praktischer Nutzen, Social Proof, Zahlen/Fakten, o.ä.) und ordne das an den Engagement-Zahlen relativ zu den anderen Posts ein.

Posts:
${list}`,
      },
    ],
  });

  const toolUse = message.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  const results = (toolUse?.input as { results?: Array<{ id: string; category: string; why: string }> })
    ?.results;
  if (!results) return {};

  const byId: Record<string, PostAnalysisResult> = {};
  for (const r of results) {
    if (!r.id) continue;
    const category = HOOK_CATEGORIES.includes(r.category as HookCategory)
      ? (r.category as HookCategory)
      : "other";
    byId[r.id] = { category, why: r.why ?? "" };
  }
  return byId;
}

export type ContentIdea = {
  title: string;
  hook: string;
  reasoning: string;
};

/** Generate concrete content ideas for the user's own account from what resonated. */
export async function generateContentIdeas(
  posts: PostAnalysisInput[]
): Promise<ContentIdea[]> {
  if (posts.length === 0) return [];

  const list = posts
    .map((p) =>
      [
        `hook: ${p.hook ?? "(kein Hook)"}`,
        `likes: ${p.like_count ?? "?"} · kommentare: ${p.comment_count ?? "?"} · views: ${p.view_count ?? "?"}`,
        `caption: ${(p.caption ?? "").slice(0, 400)}`,
      ].join("\n")
    )
    .join("\n---\n");

  const tool: Anthropic.Tool = {
    name: "submit_ideas",
    description: "Liefert konkrete Content-Ideen basierend auf erfolgreichen Referenz-Postings.",
    input_schema: {
      type: "object",
      properties: {
        ideas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Kurzer Arbeitstitel des Posting-Konzepts" },
              hook: { type: "string", description: "Konkret formulierter erster Satz/Hook auf Deutsch" },
              reasoning: {
                type: "string",
                description: "1-2 Sätze: warum das Muster bei den Referenz-Postings funktioniert hat",
              },
            },
            required: ["title", "hook", "reasoning"],
          },
        },
      },
      required: ["ideas"],
    },
  };

  const message = await getClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 3072,
    tools: [tool],
    tool_choice: { type: "tool", name: "submit_ideas" },
    messages: [
      {
        role: "user",
        content: `Das hier sind Instagram-Postings von anderen Accounts, die der Nutzer als "gut/merkenswert" markiert hat (Referenz für das, was bei seinem eigenen Publikum ziehen könnte). Der Nutzer betreibt selbst den Account @heysash85.

Analysiere die gemeinsamen Muster (Hook-Typen, Themen, Tonalität) und schlag 6 konkrete, direkt umsetzbare Content-Ideen für @heysash85 vor, die diese Muster aufgreifen — jeweils mit Arbeitstitel, einem fertig formulierten Hook-Satz und einer kurzen Begründung, warum das Muster funktioniert.

Referenz-Postings:
${list}`,
      },
    ],
  });

  const toolUse = message.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  const ideas = (toolUse?.input as { ideas?: ContentIdea[] })?.ideas;
  return ideas ?? [];
}
