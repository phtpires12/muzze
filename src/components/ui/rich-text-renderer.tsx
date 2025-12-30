import React from 'react';
import { cn } from '@/lib/utils';

// Allowed HTML tags for sanitization
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre',
  'span', 'div'
]);

/**
 * Decodes HTML entities like &lt; &gt; &amp; etc.
 */
function decodeHtmlEntities(html: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
}

/**
 * Recursively sanitizes a DOM node, keeping only allowed tags
 */
function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  // Get sanitized children content
  let childrenContent = '';
  element.childNodes.forEach((child) => {
    childrenContent += sanitizeNode(child);
  });

  // If tag is allowed, wrap content in the tag
  if (ALLOWED_TAGS.has(tagName)) {
    // For void elements like br, don't add children
    if (tagName === 'br') {
      return '<br />';
    }
    return `<${tagName}>${childrenContent}</${tagName}>`;
  }

  // If tag is not allowed, just return the children content (strip the tag)
  return childrenContent;
}

/**
 * Sanitizes HTML string, allowing only safe tags
 */
function sanitizeHtml(html: string): string {
  if (!html) return '';

  try {
    // First decode any HTML entities
    const decoded = decodeHtmlEntities(html);
    
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(decoded, 'text/html');
    
    // Sanitize the body content
    let result = '';
    doc.body.childNodes.forEach((node) => {
      result += sanitizeNode(node);
    });
    
    return result;
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    // Fallback: strip all HTML tags
    return html.replace(/<[^>]*>/g, '');
  }
}

interface RichTextRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders HTML content safely with sanitization.
 * Only allows basic formatting tags (p, strong, em, ul, ol, li, etc.)
 * Automatically decodes HTML entities and applies prose styling.
 */
export function RichTextRenderer({ content, className }: RichTextRendererProps) {
  if (!content) {
    return null;
  }

  const sanitizedHtml = sanitizeHtml(content);

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
        'prose-headings:text-foreground prose-p:text-foreground',
        'prose-strong:text-foreground prose-em:text-foreground',
        'prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

export default RichTextRenderer;
