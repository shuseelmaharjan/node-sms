"use client";

import React, { useEffect } from "react";
import {
  useEditor,
  useEditorState,
  EditorContent,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FieldError } from "react-hook-form";
import {
  ArrowUUpLeftIcon,
  ArrowUUpRightIcon,
  CodeSimpleIcon,
  EraserIcon,
  LinkSimpleBreakIcon,
  LinkSimpleIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  MinusIcon,
  QuotesIcon,
  TextBolderIcon,
  TextHOneIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextUnderlineIcon,
} from "@phosphor-icons/react";

export type RichTextJsonValue = JSONContent | null;

type RichTextEditorProps = {
  value: RichTextJsonValue;
  onChange: (value: RichTextJsonValue) => void;
  label?: string;
  required?: boolean;
  error?: FieldError;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
  id?: string;
};

const createExtensions = (placeholder: string) => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
  }),
  Placeholder.configure({
    placeholder,
  }),
];

function createEmptyDoc(): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
      },
    ],
  };
}

function isSameJson(a: RichTextJsonValue, b: RichTextJsonValue) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function RichTextEditor({
  value,
  onChange,
  label,
  required = false,
  error,
  placeholder = "Write something...",
  disabled = false,
  className,
  minHeight = "16rem",
  id,
}: RichTextEditorProps) {
  const generatedId = React.useId();
  const editorId = id ?? generatedId;

  const editor = useEditor({
    extensions: createExtensions(placeholder),
    content: value ?? createEmptyDoc(),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "ProseMirror outline-none px-4 py-3",
          "min-h-[inherit]",
          "text-sm leading-6 text-foreground",
          disabled && "cursor-not-allowed opacity-70"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;

    const current = editor.getJSON();
    const next = value ?? createEmptyDoc();

    if (!isSameJson(current, next)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const hasError = !!error;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? (
        <Label htmlFor={editorId} className="text-sm font-medium">
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
      ) : null}

      <div
        id={editorId}
        className={cn(
          "overflow-hidden rounded-2xl border bg-card shadow-sm",
          hasError && "border-destructive"
        )}
      >
        <Toolbar editor={editor} disabled={disabled} hasError={hasError} />

        <div
          className={cn(
            "bg-white",
            "[&_.ProseMirror]:min-h-[16rem]",
            "[&_.ProseMirror]:focus:outline-none",
            "[&_.ProseMirror_p]:my-2",
            "[&_.ProseMirror_h1]:mt-4 [&_.ProseMirror_h1]:mb-2 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold",
            "[&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold",
            "[&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold",
            "[&_.ProseMirror_ul]:my-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6",
            "[&_.ProseMirror_ol]:my-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6",
            "[&_.ProseMirror_li]:my-1",
            "[&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-muted-foreground",
            "[&_.ProseMirror_pre]:my-3 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-4",
            "[&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-[0.9em]",
            "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline",
            "[&_.ProseMirror_hr]:my-4 [&_.ProseMirror_hr]:border-border",
            "[&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none",
            "[&_.ProseMirror_.is-editor-empty:first-child::before]:float-left",
            "[&_.ProseMirror_.is-editor-empty:first-child::before]:h-0",
            "[&_.ProseMirror_.is-editor-empty:first-child::before]:text-muted-foreground",
            "[&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
          )}
          style={{ minHeight }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {error ? (
        <p className="mt-1 text-xs font-medium text-destructive">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}

type ToolbarProps = {
  editor: Editor;
  disabled?: boolean;
  hasError?: boolean;
};

function Toolbar({ editor, disabled, hasError }: ToolbarProps) {
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive("bold") ?? false,
      canBold: ctx.editor.can().chain().focus().toggleBold().run() ?? false,

      isItalic: ctx.editor.isActive("italic") ?? false,
      canItalic: ctx.editor.can().chain().focus().toggleItalic().run() ?? false,

      isStrike: ctx.editor.isActive("strike") ?? false,
      canStrike: ctx.editor.can().chain().focus().toggleStrike().run() ?? false,

      isCode: ctx.editor.isActive("code") ?? false,
      canCode: ctx.editor.can().chain().focus().toggleCode().run() ?? false,

      isHeading1: ctx.editor.isActive("heading", { level: 1 }) ?? false,
      isHeading2: ctx.editor.isActive("heading", { level: 2 }) ?? false,
      isHeading3: ctx.editor.isActive("heading", { level: 3 }) ?? false,

      isBulletList: ctx.editor.isActive("bulletList") ?? false,
      isOrderedList: ctx.editor.isActive("orderedList") ?? false,
      isBlockquote: ctx.editor.isActive("blockquote") ?? false,
      isCodeBlock: ctx.editor.isActive("codeBlock") ?? false,
      isLink: ctx.editor.isActive("link") ?? false,
      isUnderline: ctx.editor.isActive("underline") ?? false,

      canUndo: ctx.editor.can().chain().focus().undo().run() ?? false,
      canRedo: ctx.editor.can().chain().focus().redo().run() ?? false,
    }),
  });

  const setLink = () => {
    const prevUrl = (editor.getAttributes("link").href as string) || "";
    const url = window.prompt("Enter URL", prevUrl || "https://");

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank" })
      .run();
  };

  const unsetLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  };

  const toolbarBtn = "h-8 w-8 rounded-lg";
  const activeVariant = "default" as const;
  const inactiveVariant = "ghost" as const;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 border-b bg-muted/30 px-3 py-2",
        hasError && "border-destructive/50"
      )}
    >
      <Button
        type="button"
        variant={state.isHeading1 ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        disabled={disabled}
      >
        <TextHOneIcon size={16} />
      </Button>

      <Button
        type="button"
        variant={state.isHeading2 ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={disabled}
      >
        <TextHTwoIcon size={16} />
      </Button>

      <Button
        type="button"
        variant={state.isHeading3 ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        disabled={disabled}
      >
        <TextHThreeIcon size={16} />
      </Button>

      <div className="mx-1 h-8 w-px bg-border" />

      <Button
        type="button"
        variant={state.isBold ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled || !state.canBold}
      >
        <TextBolderIcon size={16} />
      </Button>

      <Button
        type="button"
        variant={state.isItalic ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled || !state.canItalic}
      >
        <TextItalicIcon size={16} />
      </Button>

      <Button
        type="button"
        variant={state.isUnderline ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={disabled}
      >
        <TextUnderlineIcon size={16} />
      </Button>

      <Button
        type="button"
        variant={state.isStrike ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={disabled || !state.canStrike}
      >
        <TextStrikethroughIcon size={16} />
      </Button>

      <Button
        type="button"
        variant={state.isCode ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={disabled || !state.canCode}
      >
        <CodeSimpleIcon size={16} />
      </Button>

      <div className="mx-1 h-8 w-px bg-border" />

      <Button
        type="button"
        variant={state.isBulletList ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
      >
        <ListBulletsIcon size={16} />
      </Button>

      <Button
        type="button"
        variant={state.isOrderedList ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
      >
        <ListNumbersIcon size={16} />
      </Button>

      <Button
        type="button"
        variant={state.isBlockquote ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        disabled={disabled}
      >
        <QuotesIcon size={16} />
      </Button>

      <Button
        type="button"
        variant={state.isCodeBlock ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        disabled={disabled}
      >
        <CodeSimpleIcon size={16} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={disabled}
      >
        <MinusIcon size={16} />
      </Button>

      <div className="mx-1 h-8 w-px bg-border" />

      <Button
        type="button"
        variant={state.isLink ? activeVariant : inactiveVariant}
        size="icon"
        className={toolbarBtn}
        onClick={setLink}
        disabled={disabled}
      >
        <LinkSimpleIcon size={16} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={toolbarBtn}
        onClick={unsetLink}
        disabled={disabled || !state.isLink}
      >
        <LinkSimpleBreakIcon size={16} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={toolbarBtn}
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        disabled={disabled}
      >
        <EraserIcon size={16} />
      </Button>

      <div className="ml-auto flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarBtn}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !state.canUndo}
        >
          <ArrowUUpLeftIcon size={16} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarBtn}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !state.canRedo}
        >
          <ArrowUUpRightIcon size={16} />
        </Button>
      </div>
    </div>
  );
}