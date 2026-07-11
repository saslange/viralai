export type TrackedAccount = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  notes: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
};

export type MediaType = "image" | "video" | "carousel";

export type Post = {
  id: string;
  account_id: string;
  ig_post_id: string;
  permalink: string | null;
  media_type: MediaType;
  media_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  hook: string | null;
  like_count: number | null;
  comment_count: number | null;
  view_count: number | null;
  posted_at: string | null;
  fetched_at: string;
  hook_category: string | null;
};

export type SwipeDecision = "keep" | "leave" | "save";

export type Swipe = {
  id: string;
  post_id: string;
  decision: SwipeDecision;
  swiped_at: string;
};

export type PostWithAccount = Post & { tracked_accounts: Pick<TrackedAccount, "username" | "avatar_url"> };
