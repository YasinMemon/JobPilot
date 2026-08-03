"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Strikethrough,
} from "lucide-react";

// ─── Toolbar Button ───────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive = false,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all duration-150
        ${
          isActive
            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
        }
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-4 w-px bg-[#27272a]" />;
}

// ─── Rich Email Editor ────────────────────────────────────────────────────────

interface RichEmailEditorProps {
  /** Initial HTML content to populate the editor (e.g. AI-generated email). */
  initialContent?: string;
  /** Called whenever the editor content changes, with the latest HTML string. */
  onChange: (html: string) => void;
}

/**
 * Tiptap-based rich text editor for composing HTML emails.
 * Supports Bold, Italic, Underline, Strike, ordered/unordered lists,
 * Links, Undo, and Redo.
 *
 * When `initialContent` changes (new AI generation), the editor content
 * is replaced while preserving the cursor if the content actually differs.
 */
export function RichEmailEditor({
  initialContent = "",
  onChange,
}: RichEmailEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-400 underline",
        },
      }),
      Placeholder.configure({
        placeholder: "Your email will appear here after generation…",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none min-h-[220px] px-5 py-4 text-[13px] text-zinc-300 leading-relaxed outline-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync editor content when AI generates a new email
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (initialContent && current !== initialContent) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [initialContent, editor]);

  if (!editor) return null;

  // ── Link handler ──────────────────────────────────────────────────────────
  const handleSetLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL:", prev ?? "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col rounded-xl border border-[#27272a] bg-[#0d0d0d] overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 border-b border-[#27272a] px-2 py-1.5 flex-wrap">
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Inline marks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Link */}
        <ToolbarButton
          onClick={handleSetLink}
          isActive={editor.isActive("link")}
          title="Insert/Edit Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* ── Editor area ───────────────────────────────────────────────────── */}
      <EditorContent editor={editor} />
    </div>
  );
}
