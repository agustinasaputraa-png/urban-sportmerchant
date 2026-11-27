"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  LoaderCircle,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  disabled?: boolean;
};

const imageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => element.getAttribute("data-width") || "100%",
        renderHTML: (attributes) => ({
          "data-width": attributes.width,
          style: `width:${attributes.width};max-width:100%;height:auto;display:block;margin-left:${attributes.align === "left" ? "0" : attributes.align === "right" ? "auto" : "auto"};margin-right:${attributes.align === "right" ? "0" : attributes.align === "left" ? "auto" : "auto"};`,
        }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({
          "data-align": attributes.align,
        }),
      },
    };
  },
});

function toEditorHtml(value: string) {
  if (!value) return "<p></p>";
  // Keep existing rich HTML; convert legacy plain-text descriptions safely.
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return `<p>${value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")}</p>`;
}

function ToolButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-gray-200 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
          : "border-[var(--border)] bg-[#242424] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      }`}
    >
      {children}
    </button>
  );
}

export default function ProductDescriptionEditor({
  value,
  onChange,
  onUploadImage,
  disabled = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      imageExtension.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: toEditorHtml(value),
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[220px] px-4 py-3 text-sm text-gray-200 outline-none focus:outline-none [&_p]:my-3 [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-[var(--accent)] [&_a]:underline [&_img]:mx-auto [&_img]:rounded-lg",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = toEditorHtml(value);
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  async function handleImageSelected(file?: File) {
    if (!file || !editor) return;
    setError("");

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Format gambar harus PNG, JPG, atau WEBP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await onUploadImage(file);
      editor
        .chain()
        .focus()
        .setImage({
          src: imageUrl,
          alt: file.name,
          title: file.name,
        })
        .run();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal mengunggah gambar deskripsi.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function insertLink() {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Masukkan URL tautan", current || "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Gunakan URL http atau https.");
      }
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: parsed.href })
        .run();
    } catch {
      setError("URL tautan tidak valid.");
    }
  }

  function setImageWidth(width: string) {
    if (!editor) return;
    editor.chain().focus().updateAttributes("image", { width }).run();
  }

  function setImageAlign(align: "left" | "center" | "right") {
    if (!editor) return;
    editor.chain().focus().updateAttributes("image", { align }).run();
  }

  if (!editor) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-[var(--border)] bg-[#202020] text-sm text-gray-500">
        <LoaderCircle className="mr-2 animate-spin" size={16} />
        Menyiapkan editor...
      </div>
    );
  }

  const buttonDisabled = disabled || uploading;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[#202020] focus-within:border-[var(--accent)]">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border)] bg-[#242424] p-2">
        <ToolButton
          title="Tebal"
          active={editor.isActive("bold")}
          disabled={buttonDisabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolButton>
        <ToolButton
          title="Miring"
          active={editor.isActive("italic")}
          disabled={buttonDisabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolButton>
        <ToolButton
          title="Garis bawah"
          active={editor.isActive("underline")}
          disabled={buttonDisabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </ToolButton>
        <ToolButton
          title="Coret"
          active={editor.isActive("strike")}
          disabled={buttonDisabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </ToolButton>
        <span className="mx-1 h-6 w-px bg-white/10" />
        <ToolButton
          title="Subjudul"
          active={editor.isActive("heading", { level: 2 })}
          disabled={buttonDisabled}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={16} />
        </ToolButton>
        <ToolButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          disabled={buttonDisabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolButton>
        <ToolButton
          title="Numbering"
          active={editor.isActive("orderedList")}
          disabled={buttonDisabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolButton>
        <span className="mx-1 h-6 w-px bg-white/10" />
        <ToolButton
          title="Rata kiri"
          active={editor.isActive({ textAlign: "left" })}
          disabled={buttonDisabled}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={16} />
        </ToolButton>
        <ToolButton
          title="Tengah"
          active={editor.isActive({ textAlign: "center" })}
          disabled={buttonDisabled}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={16} />
        </ToolButton>
        <ToolButton
          title="Rata kanan"
          active={editor.isActive({ textAlign: "right" })}
          disabled={buttonDisabled}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={16} />
        </ToolButton>
        <span className="mx-1 h-6 w-px bg-white/10" />
        <ToolButton
          title="Tambah tautan"
          disabled={buttonDisabled}
          onClick={insertLink}
        >
          <LinkIcon size={16} />
        </ToolButton>
        <ToolButton
          title="Upload gambar"
          disabled={buttonDisabled}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : (
            <ImagePlus size={16} />
          )}
        </ToolButton>
        <ToolButton
          title="Undo"
          disabled={buttonDisabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={16} />
        </ToolButton>
        <ToolButton
          title="Redo"
          disabled={buttonDisabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={16} />
        </ToolButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={buttonDisabled}
          onChange={(event) =>
            void handleImageSelected(event.target.files?.[0])
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        <span className="mr-1 text-[11px] text-gray-500">Gambar terpilih:</span>
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={() => setImageWidth("30%")}
          className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-gray-300 hover:border-[var(--accent)]"
        >
          Kecil
        </button>
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={() => setImageWidth("60%")}
          className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-gray-300 hover:border-[var(--accent)]"
        >
          Sedang
        </button>
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={() => setImageWidth("100%")}
          className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-gray-300 hover:border-[var(--accent)]"
        >
          Lebar penuh
        </button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={() => setImageAlign("left")}
          className="text-[11px] text-gray-400 hover:text-[var(--accent)]"
        >
          Kiri
        </button>
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={() => setImageAlign("center")}
          className="text-[11px] text-gray-400 hover:text-[var(--accent)]"
        >
          Tengah
        </button>
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={() => setImageAlign("right")}
          className="text-[11px] text-gray-400 hover:text-[var(--accent)]"
        >
          Kanan
        </button>
      </div>

      <EditorContent editor={editor} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-2 text-[11px] text-gray-500">
        <span>PNG, JPG, WEBP · Maksimal 2 MB per gambar</span>
      </div>
      {error && (
        <p
          role="alert"
          className="border-t border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}
