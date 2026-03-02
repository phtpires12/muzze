import { Extension } from '@tiptap/core';

export const NotionListKeymap = Extension.create({
  name: 'notionListKeymap',

  addKeyboardShortcuts() {
    return {
      // Override Backspace to "lift" out of list (Notion behavior)
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        // Only handle if selection is empty (just cursor, no selection)
        if (!empty) {
          return false;
        }

        // Check if we're inside a list item
        const listItem = $from.node($from.depth);
        const isInListItem = listItem?.type.name === 'listItem' || 
          $from.parent.type.name === 'listItem' ||
          // Check parent nodes for listItem
          (() => {
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === 'listItem') {
                return true;
              }
            }
            return false;
          })();

        if (!isInListItem) {
          return false;
        }

        // Check if cursor is at the very start of the text content
        // We need to check if we're at offset 0 of the first text node
        const parentOffset = $from.parentOffset;
        
        if (parentOffset === 0) {
          // At the start of a paragraph inside list item - lift it out
          return editor.chain().liftListItem('listItem').run();
        }

        // Let default behavior handle other cases
        return false;
      },
    };
  },
});
