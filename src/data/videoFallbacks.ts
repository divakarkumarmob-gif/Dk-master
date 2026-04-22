/**
 * We are removing fake/hallucinated fallback IDs because they cause "Video Unavailable" error.
 * Returning null forces the app to hit the backend /api/youtube-search which uses yt-search
 * to get real, guaranteed playable IDs dynamically.
 */
export const getFallbackVideoId = (chapter: string): string | null => {
  return null;
};
