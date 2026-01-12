import { Node, mergeAttributes } from '@tiptap/core';

export interface SectionHeaderOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sectionHeader: {
      insertSectionHeader: (section: string, label: string) => ReturnType;
    };
  }
}

/**
 * SectionHeader - Custom TipTap node for fixed section headers
 * 
 * Features:
 * - Non-editable: Users cannot type inside headers
 * - Non-draggable: Headers stay in fixed positions
 * - Non-selectable: Cannot be selected with cursor
 * - Atomic: Treated as an indivisible unit
 * - Isolating: Content blocks don't "leak" through headers
 * 
 * Headers delimit the 4 script sections: Gancho, Setup, Desenvolvimento, Conclusão
 */
export const SectionHeader = Node.create<SectionHeaderOptions>({
  name: 'sectionHeader',
  group: 'block',
  content: '',           // Does not accept child content
  atom: true,            // Treated as indivisible unit
  draggable: false,      // Cannot be dragged
  selectable: false,     // Cannot be selected
  isolating: true,       // Blocks don't "leak" through
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  
  addAttributes() {
    return {
      section: {
        default: 'gancho',
        parseHTML: element => element.getAttribute('data-section'),
        renderHTML: attributes => ({
          'data-section': attributes.section,
        }),
      },
      label: {
        default: '🪝 GANCHO',
        parseHTML: element => element.textContent,
        renderHTML: () => ({}), // Label is rendered as text content
      },
    };
  },
  
  parseHTML() {
    return [{
      tag: 'div[data-section]',
      getAttrs: element => {
        if (typeof element === 'string') return false;
        return {
          section: element.getAttribute('data-section'),
          label: element.textContent,
        };
      },
    }];
  },
  
  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-section': node.attrs.section,
        'class': 'section-header',
        'contenteditable': 'false',
      }),
      node.attrs.label,
    ];
  },
  
  // Block delete/backspace on section headers
  addKeyboardShortcuts() {
    return {
      'Backspace': ({ editor }) => {
        const { $anchor } = editor.state.selection;
        // Check if cursor is right after a section header
        const nodeBefore = $anchor.nodeBefore;
        if (nodeBefore?.type.name === 'sectionHeader') {
          return true; // Block deletion
        }
        // Check if inside or at section header
        if ($anchor.parent.type.name === 'sectionHeader') {
          return true; // Block deletion
        }
        return false;
      },
      'Delete': ({ editor }) => {
        const { $anchor } = editor.state.selection;
        // Check if cursor is right before a section header
        const nodeAfter = $anchor.nodeAfter;
        if (nodeAfter?.type.name === 'sectionHeader') {
          return true; // Block deletion
        }
        // Check if inside or at section header
        if ($anchor.parent.type.name === 'sectionHeader') {
          return true; // Block deletion
        }
        return false;
      },
    };
  },
  
  addCommands() {
    return {
      insertSectionHeader: (section: string, label: string) => ({ chain }) => {
        return chain()
          .insertContent({
            type: this.name,
            attrs: { section, label },
          })
          .run();
      },
    };
  },
});
