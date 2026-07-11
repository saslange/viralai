import type { MediaType } from "@/lib/types";

/**
 * Adapter around the ScrapeCreators Instagram "user posts" endpoint.
 *
 * NOTE: field names below are our best guess (ScrapeCreators generally mirrors
 * Instagram's internal post shape: pk/code/caption/like_count/comment_count/
 * play_count/media_type/image_versions2/video_versions/taken_at). Once you have
 * a real API key, run one sync and check the console/log output — if fields come
 * back empty, paste a sample raw response and we'll fix the mapping here in one place.
 */

export type NormalizedPost = {
  ig_post_id: string;
  permalink: string | null;
  media_type: MediaType;
  media_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  like_count: number | null;
  comment_count: number | null;
  view_count: number | null;
  posted_at: string | null;
};

const API_BASE = "https://api.scrapecreators.com/v2/instagram/user/posts";

function mapMediaType(raw: unknown): MediaType {
  if (raw === 2 || raw === "video" || raw === "VIDEO" || raw === "GraphVideo") return "video";
  if (raw === 8 || raw === "carousel" || raw === "GraphSidecar") return "carousel";
  return "image";
}

function toIsoDate(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "number") {
    // Unix seconds vs. milliseconds
    const ms = raw > 10_000_000_000 ? raw : raw * 1000;
    return new Date(ms).toISOString();
  }
  const parsed = new Date(String(raw));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeItem(item: Record<string, unknown>): NormalizedPost | null {
  const id = item.pk ?? item.id ?? item.code ?? item.shortcode;
  if (!id) return null;

  const captionText =
    (item.caption as { text?: string } | string | null | undefined) &&
    typeof item.caption === "object"
      ? (item.caption as { text?: string })?.text ?? null
      : ((item.caption as string | null | undefined) ?? null);

  const imageCandidates = (item.image_versions2 as { candidates?: { url: string }[] } | undefined)
    ?.candidates;
  const videoVersions = item.video_versions as { url: string }[] | undefined;
  const code = (item.code as string | undefined) ?? (item.shortcode as string | undefined);

  return {
    ig_post_id: String(id),
    permalink: code ? `https://www.instagram.com/p/${code}/` : (item.permalink as string) ?? null,
    media_type: mapMediaType(item.media_type),
    media_url: videoVersions?.[0]?.url ?? imageCandidates?.[0]?.url ?? (item.media_url as string) ?? null,
    thumbnail_url: imageCandidates?.[0]?.url ?? (item.thumbnail_url as string) ?? null,
    caption: captionText,
    like_count: (item.like_count as number) ?? null,
    comment_count: (item.comment_count as number) ?? null,
    view_count: (item.play_count as number) ?? (item.view_count as number) ?? null,
    posted_at: toIsoDate(item.taken_at ?? item.taken_at_timestamp ?? item.timestamp),
  };
}

export async function fetchUserPosts(username: string): Promise<NormalizedPost[]> {
  const apiKey = process.env.SCRAPECREATORS_API_KEY;
  if (!apiKey) throw new Error("SCRAPECREATORS_API_KEY ist nicht gesetzt");

  const url = `${API_BASE}?handle=${encodeURIComponent(username)}`;
  const res = await fetch(url, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`ScrapeCreators-Fehler für @${username}: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const items: Record<string, unknown>[] = json.items ?? json.data ?? json.posts ?? [];

  return items.map(normalizeItem).filter((p): p is NormalizedPost => p !== null);
}

export function extractHook(caption: string | null): string | null {
  if (!caption) return null;
  const firstLine = caption.split("\n")[0].trim();
  return firstLine.length > 110 ? `${firstLine.slice(0, 110)}…` : firstLine;
}
