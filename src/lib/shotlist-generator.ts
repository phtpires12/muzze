// Utility functions for generating ShotList from script content

export interface ShotItem {
  id: string;
  scriptSegment: string;
  scene: string;
  shotImagePaths: string[];      // Paths no Storage (fonte da verdade)
  shotImageUrls?: string[];      // DEPRECADO: mantido para compatibilidade
  location: string;
  sectionName?: string;
  isCompleted?: boolean;
  videoUrl?: string;             // Link do vídeo gravado (Drive/Dropbox/YouTube)
  videoType?: 'google_drive' | 'dropbox' | 'youtube' | 'other';
}

interface ContentSections {
  gancho: string;
  setup: string;
  desenvolvimento: string;
  conclusao: string;
}

/**
 * Extracts paragraphs from HTML content (p and li elements)
 */
function extractParagraphsFromHtml(html: string): string[] {
  if (!html || typeof html !== 'string') return [];
  
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const elements = doc.querySelectorAll('p, li');
  const paragraphs: string[] = [];
  
  elements.forEach(el => {
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (text.length > 0) {
      paragraphs.push(text);
    }
  });
  
  return paragraphs;
}

/**
 * Generates ShotItem array from script content sections
 */
export function generateShotListFromContent(content: ContentSections): ShotItem[] {
  const sections = [
    { key: 'gancho', name: 'Gancho' },
    { key: 'setup', name: 'Setup' },
    { key: 'desenvolvimento', name: 'Desenvolvimento' },
    { key: 'conclusao', name: 'Conclusão' },
  ] as const;
  
  const shots: ShotItem[] = [];
  
  sections.forEach(({ key, name }) => {
    const html = content[key] || '';
    const paragraphs = extractParagraphsFromHtml(html);
    
    paragraphs.forEach(text => {
      shots.push({
        id: crypto.randomUUID(),
        scriptSegment: text,
        sectionName: name,
        scene: '',
        location: '',
        shotImagePaths: [],
        isCompleted: false,
      });
    });
  });
  
  return shots;
}

/**
 * Normalizes text for comparison (lowercase, trim, collapse spaces)
 */
export function normalizeText(text: string): string {
  return (text || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Infers the roll type based on shot metadata
 * A-roll: No scene description AND no reference images (just talking to camera)
 * B-roll: Has scene description OR has reference images (needs specific coverage)
 */
export function inferRollType(shot: ShotItem): 'a-roll' | 'b-roll' {
  const hasScene = shot.scene && shot.scene.trim().length > 0;
  const hasReferenceImages = shot.shotImagePaths && shot.shotImagePaths.length > 0;
  return (hasScene || hasReferenceImages) ? 'b-roll' : 'a-roll';
}
