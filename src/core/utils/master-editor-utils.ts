import { Editor } from '@tiptap/core';
import { DOMSerializer } from '@tiptap/pm/model';

export interface ContentSections {
  gancho: string;
  setup: string;
  desenvolvimento: string;
  conclusao: string;
}

export const SECTION_CONFIG = [
  { key: 'gancho', label: '🪝 GANCHO' },
  { key: 'setup', label: '🤨 SETUP' },
  { key: 'desenvolvimento', label: '🦅 DESENVOLVIMENTO' },
  { key: 'conclusao', label: '📩 CONCLUSÃO' },
] as const;

type SectionKey = typeof SECTION_CONFIG[number]['key'];

/**
 * Parse inline content from an HTML element into TipTap JSON format
 */
function parseInlineContent(el: Element): any[] {
  const content: any[] = [];
  
  el.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || '';
      if (text) {
        content.push({ type: 'text', text });
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as Element;
      const tag = childEl.tagName.toLowerCase();
      const marks: any[] = [];
      
      if (tag === 'strong' || tag === 'b') marks.push({ type: 'bold' });
      if (tag === 'em' || tag === 'i') marks.push({ type: 'italic' });
      if (tag === 'u') marks.push({ type: 'underline' });
      if (tag === 's' || tag === 'strike') marks.push({ type: 'strike' });
      if (tag === 'code') marks.push({ type: 'code' });
      if (tag === 'a') {
        const href = childEl.getAttribute('href');
        if (href) {
          marks.push({ type: 'link', attrs: { href } });
        }
      }
      
      // Handle nested inline elements (e.g., <strong><em>text</em></strong>)
      if (['strong', 'b', 'em', 'i', 'u', 's', 'strike', 'code', 'a'].includes(tag)) {
        const nestedContent = parseInlineContent(childEl);
        nestedContent.forEach(item => {
          if (item.type === 'text') {
            content.push({
              type: 'text',
              text: item.text,
              marks: [...(item.marks || []), ...marks],
            });
          } else {
            content.push(item);
          }
        });
      } else if (tag === 'br') {
        content.push({ type: 'hardBreak' });
      } else {
        // Fallback: extract text content
        const text = childEl.textContent || '';
        if (text) {
          content.push({
            type: 'text',
            text,
            ...(marks.length > 0 ? { marks } : {}),
          });
        }
      }
    }
  });
  
  return content;
}

/**
 * Parse list items from ul/ol element
 */
function parseListItems(listEl: Element): any[] {
  const items: any[] = [];
  
  listEl.querySelectorAll(':scope > li').forEach(li => {
    // Check for nested lists
    const nestedUl = li.querySelector(':scope > ul');
    const nestedOl = li.querySelector(':scope > ol');
    
    const itemContent: any[] = [];
    
    // Get text content (excluding nested lists)
    const textContent = Array.from(li.childNodes)
      .filter(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          return !['ul', 'ol'].includes(el.tagName.toLowerCase());
        }
        return true;
      })
      .map(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        }
        return (node as Element).outerHTML;
      })
      .join('');
    
    // Parse the text content as a paragraph
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textContent;
    const inlineContent = parseInlineContent(tempDiv);
    
    if (inlineContent.length > 0) {
      itemContent.push({
        type: 'paragraph',
        content: inlineContent,
      });
    }
    
    // Handle nested lists
    if (nestedUl) {
      itemContent.push({
        type: 'bulletList',
        content: parseListItems(nestedUl),
      });
    }
    if (nestedOl) {
      itemContent.push({
        type: 'orderedList',
        content: parseListItems(nestedOl),
      });
    }
    
    items.push({
      type: 'listItem',
      content: itemContent.length > 0 ? itemContent : [{ type: 'paragraph', content: [] }],
    });
  });
  
  return items;
}

/**
 * Convert HTML string to TipTap JSON nodes
 */
function htmlToNodes(html: string): any[] {
  if (!html || html === '<p></p>' || html.trim() === '') {
    return [{ type: 'paragraph', content: [] }];
  }
  
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const nodes: any[] = [];
  
  doc.body.childNodes.forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tagName = el.tagName.toLowerCase();
      
      if (tagName === 'p') {
        const content = parseInlineContent(el);
        nodes.push({
          type: 'paragraph',
          content: content.length > 0 ? content : [],
        });
      } else if (tagName === 'ul') {
        const items = parseListItems(el);
        if (items.length > 0) {
          nodes.push({
            type: 'bulletList',
            content: items,
          });
        }
      } else if (tagName === 'ol') {
        const items = parseListItems(el);
        if (items.length > 0) {
          nodes.push({
            type: 'orderedList',
            content: items,
          });
        }
      } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        const level = parseInt(tagName[1]);
        nodes.push({
          type: 'heading',
          attrs: { level: Math.min(level, 3) }, // TipTap StarterKit only has h1-h3
          content: parseInlineContent(el),
        });
      } else if (tagName === 'blockquote') {
        // Blockquote can contain paragraphs
        const blockquoteContent: any[] = [];
        el.querySelectorAll('p').forEach(p => {
          blockquoteContent.push({
            type: 'paragraph',
            content: parseInlineContent(p),
          });
        });
        if (blockquoteContent.length === 0) {
          blockquoteContent.push({
            type: 'paragraph',
            content: parseInlineContent(el),
          });
        }
        nodes.push({
          type: 'blockquote',
          content: blockquoteContent,
        });
      } else if (tagName === 'hr') {
        nodes.push({ type: 'horizontalRule' });
      } else if (tagName === 'pre') {
        const code = el.querySelector('code');
        nodes.push({
          type: 'codeBlock',
          content: [{ type: 'text', text: code?.textContent || el.textContent || '' }],
        });
      } else {
        // Fallback: treat as paragraph
        const content = parseInlineContent(el);
        if (content.length > 0) {
          nodes.push({
            type: 'paragraph',
            content,
          });
        }
      }
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        nodes.push({
          type: 'paragraph',
          content: [{ type: 'text', text }],
        });
      }
    }
  });
  
  return nodes.length > 0 ? nodes : [{ type: 'paragraph', content: [] }];
}

/**
 * Build a ProseMirror JSON document from the 4 content sections
 * This is the "mount" operation when loading content into the Master Editor
 */
export function buildMasterDocument(sections: ContentSections): any {
  const content: any[] = [];
  
  SECTION_CONFIG.forEach(({ key, label }) => {
    // Add section header node
    content.push({
      type: 'sectionHeader',
      attrs: { section: key, label },
    });
    
    // Add content nodes for this section
    const sectionHtml = sections[key as SectionKey] || '';
    const nodes = htmlToNodes(sectionHtml);
    content.push(...nodes);
  });
  
  return {
    type: 'doc',
    content,
  };
}

/**
 * Extract the 4 content sections from the editor's current state
 * This is the "split" operation when saving content from the Master Editor
 */
export function splitFromEditor(editor: Editor): ContentSections {
  const sections: ContentSections = {
    gancho: '',
    setup: '',
    desenvolvimento: '',
    conclusao: '',
  };
  
  const doc = editor.state.doc;
  let currentSection: SectionKey | null = null;
  const sectionNodes: Map<SectionKey, any[]> = new Map();
  
  // Initialize arrays for each section
  SECTION_CONFIG.forEach(({ key }) => sectionNodes.set(key as SectionKey, []));
  
  // Walk through all nodes in the document
  doc.forEach((node) => {
    if (node.type.name === 'sectionHeader') {
      currentSection = node.attrs.section as SectionKey;
    } else if (currentSection) {
      const nodes = sectionNodes.get(currentSection) || [];
      nodes.push(node);
      sectionNodes.set(currentSection, nodes);
    }
  });
  
  // Convert nodes of each section to HTML
  SECTION_CONFIG.forEach(({ key }) => {
    const nodes = sectionNodes.get(key as SectionKey) || [];
    if (nodes.length > 0) {
      try {
        // Create a temporary document fragment with just these nodes
        const fragment = editor.state.schema.nodes.doc.create(null, nodes);
        const div = document.createElement('div');
        
        // Serialize to HTML using ProseMirror's DOMSerializer
        const serializer = DOMSerializer.fromSchema(editor.schema);
        const domFragment = serializer.serializeFragment(fragment.content);
        div.appendChild(domFragment);
        
        sections[key as SectionKey] = div.innerHTML;
      } catch (e) {
        console.error(`Error serializing section ${key}:`, e);
        sections[key as SectionKey] = '';
      }
    }
  });
  
  return sections;
}

/**
 * Check if content is effectively empty (only has empty paragraphs)
 */
export function isSectionEmpty(html: string): boolean {
  if (!html) return true;
  const stripped = html.replace(/<p><\/p>/g, '').replace(/<br\s*\/?>/g, '').trim();
  return stripped === '';
}
