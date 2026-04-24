import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type Props = {
  value?: string;
  onChange: (value: string) => void;
};

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="bg-muted/40 rounded-2xl p-3 border">
      {/* Toolbar */}
      <div className="flex justify-end gap-3 mb-2 text-lg text-muted-foreground">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "font-bold text-black" : ""}
        >
          B
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "italic text-black" : ""}
        >
          I
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "text-black" : ""}
        >
          ••
        </button>
      </div>

      {/* Editor */}
      <div className="max-h-[200px] overflow-y-auto">
        <EditorContent
          editor={editor}
           className="max-h-[200px] min-h-[80px] overflow-y-auto p-2 outline-none text-sm border-none focus:border-none focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}