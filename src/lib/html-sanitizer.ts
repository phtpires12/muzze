/**
 * Sanitizes HTML content by removing empty or broken anchor tags.
 * This fixes the issue where pasting content with links, then deleting
 * the visible text, leaves residual <a> elements that are still clickable.
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html || html.trim() === '') return '';
  
  // Skip if not HTML (plain text)
  if (!html.includes('<')) return html;
  
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    // Find all anchor elements
    const links = doc.querySelectorAll('a');
    
    links.forEach(link => {
      const textContent = link.textContent?.trim() || '';
      const innerHTML = link.innerHTML.trim();
      
      // Check if link is effectively empty
      const isEmptyText = textContent === '';
      const hasOnlyWhitespaceOrBr = innerHTML === '' || 
        innerHTML.replace(/<br\s*\/?>/gi, '').trim() === '' ||
        innerHTML.replace(/&nbsp;/gi, '').replace(/<br\s*\/?>/gi, '').trim() === '';
      
      if (isEmptyText && hasOnlyWhitespaceOrBr) {
        // Completely empty link - remove it
        link.remove();
      } else if (isEmptyText && link.childNodes.length > 0) {
        // Link has child nodes but no visible text - unwrap (replace <a> with its content)
        const parent = link.parentNode;
        if (parent) {
          while (link.firstChild) {
            parent.insertBefore(link.firstChild, link);
          }
          link.remove();
        }
      }
      // Links with actual visible text are preserved
    });
    
    return doc.body.innerHTML;
  } catch (e) {
    // If parsing fails, return original content
    console.warn('[html-sanitizer] Failed to parse HTML:', e);
    return html;
  }
}

/**
 * Sanitizes a content object with multiple sections.
 */
export function sanitizeContentSections(content: {
  gancho?: string;
  setup?: string;
  desenvolvimento?: string;
  conclusao?: string;
}): {
  gancho: string;
  setup: string;
  desenvolvimento: string;
  conclusao: string;
} {
  return {
    gancho: sanitizeHtmlContent(content.gancho || ''),
    setup: sanitizeHtmlContent(content.setup || ''),
    desenvolvimento: sanitizeHtmlContent(content.desenvolvimento || ''),
    conclusao: sanitizeHtmlContent(content.conclusao || ''),
  };
}
