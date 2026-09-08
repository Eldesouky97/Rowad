'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { LinkIcon } from './icons';
import {
  BoldIcon, ItalicIcon, UnderlineIcon, StrikeIcon, QuoteIcon, ListIcon, ListOrderedIcon,
  AlignRightIcon, AlignCenterIcon, AlignLeftIcon, AlignJustifyIcon, UndoIcon, RedoIcon, EraserIcon,
} from './richTextIcons';

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-30 ${
        active ? 'bg-violet-600 text-white' : 'text-ink/60 hover:bg-white hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

/** محرر نصوص غني بأدوات تنسيق احترافية (عناوين، قوائم، محاذاة، روابط…) —
 * بيتعامل مع HTML كمحتوى (مش نص خام)، ومتحكَّم فيه بالكامل عبر value/onChange
 * عشان يتزامن صح لما الأدمن يتنقل بين "إضافة" و"تعديل" مقال. */
export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder || 'اكتب نص المقال هنا…' }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'rich-content min-h-[220px] max-w-none px-4 py-3 text-sm leading-8 outline-none',
        dir: 'rtl',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // تزامن المحتوى لما الأدمن يفتح مقال تاني للتعديل (value بيتغيّر من بره المحرر)
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return <div className="min-h-[260px] rounded-xl border border-ink/10 bg-white" />;
  }

  function setLink() {
    const previousUrl = editor!.getAttributes('link').href as string | undefined;
    const url = window.prompt('رابط الوصلة (اتركه فاضي لإزالة الرابط)', previousUrl || '');
    if (url === null) return;
    if (url === '') {
      editor!.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-ink/10 bg-sand/50 p-1.5">
        <ToolbarButton label="تراجع" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><UndoIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="إعادة" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><RedoIcon className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-ink/10" />
        <ToolbarButton label="عنوان رئيسي" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <span className="font-utility text-xs font-extrabold">H2</span>
        </ToolbarButton>
        <ToolbarButton label="عنوان فرعي" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <span className="font-utility text-xs font-extrabold">H3</span>
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-ink/10" />
        <ToolbarButton label="عريض" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><BoldIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="مائل" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><ItalicIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="تسطير" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="يتوسطه خط" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><StrikeIcon className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-ink/10" />
        <ToolbarButton label="قائمة نقطية" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><ListIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="قائمة مرقّمة" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrderedIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="اقتباس" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><QuoteIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="رابط" active={editor.isActive('link')} onClick={setLink}><LinkIcon className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-ink/10" />
        <ToolbarButton label="محاذاة يمين" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRightIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="محاذاة وسط" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenterIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="محاذاة يسار" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeftIcon className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="ضبط" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustifyIcon className="h-4 w-4" /></ToolbarButton>
        <span className="mx-1 h-5 w-px bg-ink/10" />
        <ToolbarButton label="مسح التنسيق" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}><EraserIcon className="h-4 w-4" /></ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
