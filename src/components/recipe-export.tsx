"use client";

import { useState, useRef } from "react";
import type { PostWithAccount } from "@/lib/types";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleExportPDF() {
    if (selectedRecipes.size === 0) {
      alert("Bitte mindestens ein Rezept auswählen");
      return;
    }

    setExporting(true);
    try {
      const selectedPosts = recipes.filter((p) => selectedRecipes.has(p.id));

      // Create a temporary container with all recipes
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.width = "210mm";
      tempContainer.style.background = "white";
      tempContainer.style.padding = "20px";
      tempContainer.style.fontFamily = "Arial, sans-serif";
      tempContainer.style.color = "#333";

      let content = '<h1 style="text-align: center; color: #16a34a; margin-bottom: 40px;">🍳 Mein Rezept Archiv</h1>';

      for (const post of selectedPosts) {
        const recipe = parseRecipeFromCaption(post.caption, post.hook);
        const title = recipe?.title || post.hook || "Rezept";

        content += `
          <div style="page-break-after: always; margin-bottom: 40px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
              ${post.thumbnail_url ? `<div style="flex-shrink: 0;"><img src="${post.thumbnail_url}" alt="${title}" style="max-width: 150px; max-height: 150px; border-radius: 4px; object-fit: cover;"></div>` : ""}
              <div style="flex: 1;">
                <h2 style="margin: 0 0 10px 0; font-size: 20px;">${title}</h2>
                <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                  <p style="margin: 0;">📸 @${post.tracked_accounts.username}</p>
                  <p style="margin: 5px 0 0 0;">❤️ ${post.like_count?.toLocaleString() || "?"} Likes · 💬 ${post.comment_count?.toLocaleString() || "?"} Kommentare</p>
                </div>
                ${post.why_it_works ? `<div style="background: #f0f0f0; padding: 10px; border-radius: 4px; font-style: italic; margin: 10px 0; font-size: 12px;"><strong>Warum es gut ankommt:</strong><br>${post.why_it_works}</div>` : ""}
              </div>
            </div>

            ${recipe?.ingredients && recipe.ingredients.length > 0 ? `
              <h3 style="font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #16a34a; padding-bottom: 5px;">🥘 Zutaten</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${recipe.ingredients.map((ing) => `<li style="margin: 5px 0; font-size: 13px;">${ing}</li>`).join("")}
              </ul>
            ` : ""}

            ${recipe?.instructions && recipe.instructions.length > 0 ? `
              <h3 style="font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #16a34a; padding-bottom: 5px;">📝 Anleitung</h3>
              <ol style="margin: 10px 0; padding-left: 20px;">
                ${recipe.instructions.map((instr) => `<li style="margin: 5px 0; font-size: 13px;">${instr}</li>`).join("")}
              </ol>
            ` : ""}

            <div style="font-size: 11px; margin-top: 15px; word-break: break-all;">
              <strong>Link:</strong> <a href="${post.permalink || "#"}" style="color: #16a34a; text-decoration: none;">${post.permalink || "N/A"}</a>
            </div>
          </div>
        `;
      }

      tempContainer.innerHTML = content;
      document.body.appendChild(tempContainer);

      // Convert to canvas and then to PDF
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      // Download PDF
      pdf.save(`rezepte-${new Date().toISOString().split("T")[0]}.pdf`);

      // Clean up
      document.body.removeChild(tempContainer);

      alert(`✅ ${selectedPosts.length} Rezept(e) als PDF exportiert!`);
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
        {exporting ? "Exportiere..." : "📥 Als PDF exportieren"}
      </button>
    </div>
  );
}
