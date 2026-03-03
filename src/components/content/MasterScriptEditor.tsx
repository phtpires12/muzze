import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import AutoJoiner from 'tiptap-extension-auto-joiner';
import { SectionHeader } from '@/core/utils/tiptap-extensions';
import { buildMasterDocument, splitFromEditor, ContentSections } from '@/core/utils';
import { ContentSection, DEFAULT_SECTIONS } from '@/core/constants/workflow-templates';
import { cn } from '@/core/utils';
import { useEffect, useRef, useCallback } from 'react';
import { useLongPressDrag } from '@/core/hooks';
import { useIsMobile } from '@/core/hooks';

interface MasterScriptEditorProps {
  content: ContentSections;
  onChange: (sections: ContentSections) => void;
  isLoaded: boolean;
  editable?: boolean;
  className?: string;
  sectionConfig?: ContentSection[];
  removableSections?: boolean;
  onRemoveSection?: (sectionKey: string) => void;
}

/**
 * MasterScriptEditor - Unified TipTap editor with fixed section headers
 * 
 * Features:
 * - Single editor containing all 4 script sections
 * - Fixed, non-draggable section headers (Gancho, Setup, Desenvolvimento, Conclusão)
 * - Notion-like drag handles for reordering paragraphs
 * - Paragraphs can be dragged across sections
 * - Content is split back into 4 HTML strings on save
 * - Mobile: Long-press on drag handle to activate drag with haptic feedback
 */
export function MasterScriptEditor({
  content,
  onChange,
  isLoaded,
  editable = true,
  className,
  sectionConfig = DEFAULT_SECTIONS,
  removableSections = false,
  onRemoveSection,
}: MasterScriptEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const isUserEditing = useRef(false);
  const lastEmittedContent = useRef<string>('');

  const isMobile = useIsMobile();

  // Enable long-press drag on mobile
  useLongPressDrag(containerRef, {
    delay: 350,
    vibration: 15,
    enabled: isMobile && editable,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        dropcursor: {
          color: 'hsl(var(--primary))',
          width: 2,
        },
        // Keep default configurations for other extensions
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
      }),
      Underline,
      SectionHeader,
      GlobalDragHandle.configure({
        dragHandleWidth: 24,
        scrollTreshold: 100,
        // Exclude section headers (divs with data-section) from getting drag handles
        excludedTags: ['div'],
      }),
      AutoJoiner.configure({
        elementsToJoin: ['bulletList', 'orderedList'],
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'paragraph') {
            return 'Escreva aqui...';
          }
          return '';
        },
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: { type: 'doc', content: [] }, // Start with empty document
    editable,
    onFocus: () => {
      isUserEditing.current = true;
    },
    onBlur: () => {
      // Small delay to not conflict with save operations
      setTimeout(() => {
        isUserEditing.current = false;
      }, 100);
    },
    onUpdate: ({ editor }) => {
      // Only emit onChange after initialization (avoid loop on load)
      if (hasInitialized.current) {
        const sections = splitFromEditor(editor, sectionConfig);
        const contentJson = JSON.stringify(sections);

        // Avoid emitting if content hasn't changed
        if (contentJson !== lastEmittedContent.current) {
          lastEmittedContent.current = contentJson;
          onChange(sections);
        }
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'min-h-[400px] px-4 py-3',
        ),
      },
    },
  });

  // Load content when data is ready (CORRECTION: use setContent instead of useMemo)
  useEffect(() => {
    if (!editor || !isLoaded || hasInitialized.current) return;

    // Guard: don't reset if user is editing
    if (isUserEditing.current) return;

    const doc = buildMasterDocument(content, sectionConfig, removableSections);
    editor.commands.setContent(doc);
    hasInitialized.current = true;

    // Store initial content to prevent unnecessary updates
    const sections = splitFromEditor(editor, sectionConfig);
    lastEmittedContent.current = JSON.stringify(sections);
  }, [editor, isLoaded, content]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Handle external content updates (e.g., from sync)
  const handleExternalContentUpdate = useCallback((newContent: ContentSections) => {
    if (!editor || !hasInitialized.current) return;
    if (isUserEditing.current) return; // Don't update while user is editing

    const currentJson = lastEmittedContent.current;
    const newJson = JSON.stringify(newContent);

    if (currentJson !== newJson) {
      const doc = buildMasterDocument(newContent, sectionConfig, removableSections);
      editor.commands.setContent(doc);
      lastEmittedContent.current = newJson;
    }
  }, [editor, sectionConfig, removableSections]);

  // Listen to remove-section event
  useEffect(() => {
    if (!removableSections || !editable || !onRemoveSection) return;

    const handleRemoveSection = (e: Event) => {
      const customEvent = e as CustomEvent<{ section: string }>;
      const { section } = customEvent.detail;
      onRemoveSection(section);
    };

    window.addEventListener('remove-section', handleRemoveSection);
    return () => window.removeEventListener('remove-section', handleRemoveSection);
  }, [removableSections, editable, onRemoveSection]);

  if (!editor) {
    return (
      <div className={cn(
        "master-script-editor rounded-lg border border-input bg-background",
        "min-h-[400px] animate-pulse",
        className
      )} />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "master-script-editor rounded-lg border border-input bg-background",
        "ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        !editable && "opacity-70 cursor-not-allowed",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
