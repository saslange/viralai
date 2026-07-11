"use client";

import { useState } from "react";
import type { PostWithAccount } from "@/lib/types";

function parseRecipeFromCaption(caption: string | null, hook: string | null): {
  title: string;
  ingredients: string[];
  instructions: string[];
} | null {
  if (!caption && !hook) return null;

  const fullText = (caption || "") + "\n" + (hook || "");
  const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);

  let title = "";
  let ingredients: string[] = [];
  let instructions: string[] = [];
  let section = "title";
  let foundSectionHeader = false;

  const ingredientPattern = /^\s*[-•*]?\s*(\d+\s*(?:g|kg|ml|l|TL|EL|Prise|Bund|Stück|Dose|Packung|Becher|Glas|Cup|oz|lb)|Ergibt|Der\s|Die\s|Das\s|Eine?\s)/i;
  const instructionPattern = /^\s*[-•*]?\s*(\d+\.|Schritt|Step|dann|anschliessend|danach)/i;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.includes("zutat") || lower.includes("ingredient") || lower.includes("zutaten") || lower.includes("ingredients")) {
      section = "ingredients";
      foundSectionHeader = true;
      continue;
    }
    if (
      lower.includes("anleitung") ||
      lower.includes("zubereitung") ||
      lower.includes("instruction") ||
      lower.includes("schritt") ||
      lower.includes("instructions") ||
      lower.includes("steps")
    ) {
      section = "instructions";
      foundSectionHeader = true;
      continue;
    }
    if (lower.includes("nährwert") || lower.includes("kcal") || lower.includes("kalorien") || lower.includes("nutrition")) {
      section = "nutrition";
      continue;
    }

    if (line.length === 0) continue;

    if (section === "title" && !title && line.length < 100 && !line.includes(":")) {
      title = line;
    } else if (section === "ingredients") {
      const cleaned = line.replace(/^[-•*]\s*/, "").replace(/^\d+\.\s*/, "").trim();
      if (cleaned && !cleaned.toLowerCase().includes("zutaten") && !cleaned.toLowerCase().includes("ingredient")) {
        ingredients.push(cleaned);
      }
    } else if (section === "instructions") {
      const cleaned = line.replace(/^[-•*]\s*/, "").replace(/^\d+\.\s*/, "").trim();
      if (cleaned && !cleaned.toLowerCase().includes("anleitung") && !cleaned.toLowerCase().includes("schritt") && !cleaned.toLowerCase().includes("instruction") && !cleaned.toLowerCase().includes("zubereitung")) {
        instructions.push(cleaned);
      }
    } else if (!foundSectionHeader) {
      // Heuristic: if no section header found yet, try to detect ingredients/instructions by pattern
      if (ingredientPattern.test(line)) {
        section = "ingredients";
        const cleaned = line.replace(/^[-•*]\s*/, "").replace(/^\d+\.\s*/, "").trim();
        if (cleaned && !cleaned.toLowerCase().includes("zutaten") && !cleaned.toLowerCase().includes("ingredient")) {
          ingredients.push(cleaned);
        }
      } else if (instructionPattern.test(line)) {
        section = "instructions";
        const cleaned = line.replace(/^[-•*]\s*/, "").replace(/^\d+\.\s*/, "").trim();
        if (cleaned && !cleaned.toLowerCase().includes("anleitung") && !cleaned.toLowerCase().includes("schritt")) {
          instructions.push(cleaned);
        }
      }
    }
  }

  if (!title && ingredients.length === 0 && instructions.length === 0) return null;

  return { title: title || "Rezept", ingredients, instructions };
}

export function RecipeExport({
  recipes,
  selectedRecipes,
}: {
  recipes: PostWithAccount[];
  selectedRecipes: Set<string>;
}) {
  const [exporting, setExporting] = useState(false);

  async function handleExportPDF() {
    if (selectedRecipes.size === 0) {
      alert("Bitte mindestens ein Rezept auswählen");
      return;
    }

    setExporting(true);
    try {
      const selectedPosts = recipes.filter((p) => selectedRecipes.has(p.id));

      // Create HTML content
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <title>Rezept Archiv</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .recipe { page-break-after: always; margin-bottom: 40px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .recipe-header { display: flex; gap: 20px; margin-bottom: 20px; }
            .recipe-image { max-width: 200px; }
            .recipe-image img { max-width: 100%; height: auto; border-radius: 4px; }
            .recipe-info { flex: 1; }
            h1 { margin: 0 0 10px 0; font-size: 24px; }
            .meta { font-size: 12px; color: #666; margin-bottom: 10px; }
            .hook { background: #f0f0f0; padding: 10px; border-radius: 4px; font-style: italic; margin: 10px 0; }
            .socials { font-size: 12px; margin: 10px 0; }
            h2 { font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #16a34a; padding-bottom: 5px; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin: 5px 0; }
            ol { margin: 10px 0; padding-left: 20px; }
            .link { font-size: 11px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <h1 style="text-align: center; color: #16a34a; margin-bottom: 40px;">🍳 Mein Rezept Archiv</h1>
      `;

      for (const post of selectedPosts) {
        const recipe = parseRecipeFromCaption(post.caption, post.hook);
        const image = post.thumbnail_url || "";
        const title = recipe?.title || post.hook || "Rezept";

        htmlContent += `
          <div class="recipe">
            <div class="recipe-header">
              ${image ? `<div class="recipe-image"><img src="${image}" alt="${title}"></div>` : ""}
              <div class="recipe-info">
                <h1>${title}</h1>
                <div class="meta">
                  <p>📸 @${post.tracked_accounts.username}</p>
                  <p>❤️ ${post.like_count?.toLocaleString() || "?"} Likes · 💬 ${post.comment_count?.toLocaleString() || "?"} Kommentare</p>
                </div>
                ${post.why_it_works ? `<div class="hook"><strong>Warum es gut ankommt:</strong><br>${post.why_it_works}</div>` : ""}
                <div class="socials">
                  <strong>Social:</strong> Instagram @${post.tracked_accounts.username}
                </div>
              </div>
            </div>

            ${recipe?.ingredients && recipe.ingredients.length > 0 ? `
              <h2>🥘 Zutaten</h2>
              <ul>
                ${recipe.ingredients.map((ing) => `<li>${ing}</li>`).join("")}
              </ul>
            ` : ""}

            ${recipe?.instructions && recipe.instructions.length > 0 ? `
              <h2>📝 Anleitung</h2>
              <ol>
                ${recipe.instructions.map((instr) => `<li>${instr}</li>`).join("")}
              </ol>
            ` : ""}

            <div class="link">
              <strong>Link:</strong> <a href="${post.permalink || "#"}" target="_blank">${post.permalink || "N/A"}</a>
            </div>
          </div>
        `;
      }

      htmlContent += `
        </body>
        </html>
      `;

      // Download as HTML (can be printed to PDF)
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rezepte-${new Date().toISOString().split("T")[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);

      alert(`✅ ${selectedPosts.length} Rezept(e) exportiert! (HTML zum Ausdrucken)`);
    } catch (err) {
      alert("❌ Fehler beim Export");
      console.error(err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
      <div className="text-sm text-neutral-700">
        <strong>{selectedRecipes.size}</strong> von <strong>{recipes.length}</strong> Rezepten ausgewählt
      </div>
      <button
        onClick={handleExportPDF}
        disabled={exporting || selectedRecipes.size === 0}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-green-700 disabled:opacity-50"
      >
        {exporting ? "Exportiere..." : "📥 Als HTML exportieren"}
      </button>
    </div>
  );
}
