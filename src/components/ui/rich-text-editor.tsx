import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import AutoJoiner from 'tiptap-extension-auto-joiner';
import { NotionListKeymap } from '@/lib/tiptap-extensions/notion-list-keymap';
import { cn } from '@/lib/utils';
import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { CornerDownLeft } from 'lucide-react';

export interface RichTextEditorRef {
  getEditor: () => Editor | null;
  insertLineBreak: () => void;
}

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  minHeight?: string;
  showMobileLineBreak?: boolean;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  content,
  onChange,
  placeholder = "Comece a escrever...",
  className,
  editable = true,
  minHeight = "80px",
  showMobileLineBreak = true,
}, ref) => {
  const isMobile = useIsMobile();
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Enable markdown-style shortcuts
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        heading: {
          levels: [1, 2, 3],
        },
        // Dropcursor for visual feedback during drag
        dropcursor: {
          color: 'hsl(var(--primary))',
          width: 2,
        },
      }),
      // Global drag handle - Notion-style block dragging
      GlobalDragHandle.configure({
        dragHandleWidth: 24,
        scrollTreshold: 100,
      }),
      // Auto-join lists when dragging to prevent broken lists
      AutoJoiner.configure({
        elementsToJoin: ['bulletList', 'orderedList'],
      }),
      Underline,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      NotionListKeymap,
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      // Get HTML content
      const html = editor.getHTML();
      // Convert empty paragraph to empty string for consistency
      if (html === '<p></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'min-h-[var(--editor-min-height)]',
        ),
        style: `--editor-min-height: ${minHeight}`,
      },
    },
  });

  // Update editor content when prop changes (e.g., loading from DB)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Only update if the content is actually different
      // and not just a formatting difference
      const editorText = editor.getText();
      const newText = stripHtml(content);
      
      if (editorText !== newText) {
        editor.commands.setContent(content || '');
      }
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Expose editor methods via ref
  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
    insertLineBreak: () => {
      if (editor) {
        editor.commands.setHardBreak();
        editor.commands.focus();
      }
    },
  }), [editor]);

  const handleMobileLineBreak = () => {
    if (editor) {
      editor.commands.setHardBreak();
      editor.commands.focus();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "rich-text-editor rounded-md border border-input bg-background px-3 py-2",
        "ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        !editable && "opacity-70 cursor-not-allowed",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <EditorContent editor={editor} />
      {/* Mobile line break button */}
      {isMobile && showMobileLineBreak && editable && (
        <button
          type="button"
          onClick={handleMobileLineBreak}
          className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          <CornerDownLeft className="w-3 h-3" />
          <span>Nova linha</span>
        </button>
      )}
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

// Helper to strip HTML tags for comparison
function stripHtml(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// Helper to convert plain text to HTML (for backward compatibility)
export function textToHtml(text: string): string {
  if (!text) return '';
  // If it already looks like HTML, return as-is
  if (text.startsWith('<')) return text;
  // Convert plain text to paragraphs
  return text
    .split('\n\n')
    .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// Helper to convert HTML to plain text (for copy/export)
export function htmlToText(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
