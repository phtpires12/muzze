import { ShotItem } from '@/core/utils/shotlist-generator';

/**
 * Parse a single shot_list item which may be:
 * - A JSON string that needs parsing
 * - An already-parsed object
 * - A plain text string (legacy format)
 */
export function parseShotItem(item: any, index: number): ShotItem {
  let parsed = item;
  
  // If it's a string, try to parse as JSON
  if (typeof item === 'string') {
    try {
      parsed = JSON.parse(item);
    } catch {
      // Fallback: treat as plain text (legacy format)
      return {
        id: `shot-${index}`,
        scriptSegment: item,
        scene: '',
        location: '',
        shotImagePaths: [],
      };
    }
  }
  
  // Now 'parsed' is guaranteed to be an object (or was already one)
  return {
    id: parsed.id || `shot-${index}`,
    scriptSegment: parsed.scriptSegment || parsed.description || '',
    scene: parsed.scene || '',
    location: parsed.location || '',
    shotImagePaths: parsed.shotImagePaths || [],
    sectionName: parsed.sectionName,
    isCompleted: parsed.isCompleted,
    videoUrl: parsed.videoUrl,
    videoType: parsed.videoType,
  };
}

/**
 * Parse an entire shot_list array from the database
 */
export function parseShotList(shotList: any[] | null): ShotItem[] {
  if (!shotList || !Array.isArray(shotList)) return [];
  return shotList.map((item, index) => parseShotItem(item, index));
}

/**
 * Strip HTML tags from a string to get plain text
 */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}
