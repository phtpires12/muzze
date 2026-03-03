import { Node, mergeAttributes } from '@tiptap/core';

export interface SectionHeaderOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sectionHeader: {
      insertSectionHeader: (section: string, label: string, removable?: boolean) => ReturnType;
    };
  }
}

export const SectionHeader = Node.create<SectionHeaderOptions>({
  name: 'sectionHeader',
  group: 'block',
  content: '',
  atom: true,
  draggable: false,
  selectable: false,
  isolating: true,

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
        renderHTML: () => ({}),
      },
      removable: {
        default: false,
        parseHTML: element => element.getAttribute('data-removable') === 'true',
        renderHTML: attributes => {
          if (!attributes.removable) return {};
          return { 'data-removable': 'true' };
        },
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
          label: element.querySelector('.section-label')?.textContent || element.textContent,
          removable: element.getAttribute('data-removable') === 'true',
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
        ...(node.attrs.removable ? { 'data-removable': 'true' } : {}),
      }),
      ['span', { class: 'section-label' }, node.attrs.label],
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      dom.classList.add('section-header');
      dom.setAttribute('data-section', node.attrs.section);
      if (node.attrs.removable) {
        dom.setAttribute('data-removable', 'true');
        dom.classList.add('flex', 'items-center', 'justify-between', 'group');
      }

      const labelSpan = document.createElement('span');
      labelSpan.classList.add('section-label');
      labelSpan.textContent = node.attrs.label;
      dom.appendChild(labelSpan);

      if (node.attrs.removable) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'section-remove-btn opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-muted-foreground hover:text-destructive p-1 rounded-md';
        removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>';

        removeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const event = new CustomEvent('remove-section', {
            detail: { section: node.attrs.section }
          });
          window.dispatchEvent(event);
        });

        dom.appendChild(removeBtn);
      }

      return {
        dom,
        ignoreMutation: () => true,
      };
    };
  },

  addKeyboardShortcuts() {
    return {
      'Backspace': ({ editor }) => {
        const { $anchor } = editor.state.selection;
        const nodeBefore = $anchor.nodeBefore;
        if (nodeBefore?.type.name === 'sectionHeader') return true;
        if ($anchor.parent.type.name === 'sectionHeader') return true;
        return false;
      },
      'Delete': ({ editor }) => {
        const { $anchor } = editor.state.selection;
        const nodeAfter = $anchor.nodeAfter;
        if (nodeAfter?.type.name === 'sectionHeader') return true;
        if ($anchor.parent.type.name === 'sectionHeader') return true;
        return false;
      },
    };
  },

  addCommands() {
    return {
      insertSectionHeader: (section: string, label: string, removable: boolean = false) => ({ chain }) => {
        return chain()
          .insertContent({
            type: this.name,
            attrs: { section, label, removable },
          })
          .run();
      },
    };
  },
});
