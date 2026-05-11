"use client";

import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

type Props = {
  getHtmlRef: MutableRefObject<() => string>;
  initialHtml?: string;
};

/**
 * Tiptap 기반 “심플 에디터” 스타일 도구줄 + HTML 소스 토글.
 * (Tiptap UI 템플릿과 동일한 패키지가 아니라, MIT 라이선스 확장으로 유사 UX 구성)
 */
export function ProjectHtmlEditor({
  getHtmlRef,
  initialHtml = "",
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [htmlBuffer, setHtmlBuffer] = useState(initialHtml);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-sky-300 underline underline-offset-2",
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: "max-h-[480px] max-w-full rounded object-contain",
        },
      }),
      Placeholder.configure({
        placeholder:
          "본문을 입력하세요. 「HTML」로 소스를 직접 편집할 수 있습니다.",
      }),
    ],
    content: initialHtml || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[280px] px-4 py-3 text-sm leading-relaxed focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  const syncToSource = useCallback(() => {
    if (editor) setHtmlBuffer(editor.getHTML());
  }, [editor]);

  const syncToVisual = useCallback(() => {
    if (editor) {
      editor.commands.setContent(htmlBuffer, { emitUpdate: true });
    }
  }, [editor, htmlBuffer]);

  const toggleSourceMode = () => {
    if (!editor) return;
    if (sourceMode) {
      syncToVisual();
      setSourceMode(false);
    } else {
      syncToSource();
      setSourceMode(true);
    }
  };

  useEffect(() => {
    getHtmlRef.current = () =>
      sourceMode ? htmlBuffer : editor?.getHTML() ?? "";
  }, [editor, sourceMode, htmlBuffer, getHtmlRef]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor || sourceMode) return;

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        window.alert(data.error ?? "이미지 업로드에 실패했습니다.");
        return;
      }
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } catch {
      window.alert("이미지 업로드 중 오류가 발생했습니다.");
    }
  };

  const headingSelectValue = (() => {
    if (!editor) return "p";
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    return "p";
  })();

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-600 bg-neutral-900 shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-700 bg-neutral-800 px-2 py-2">
        <button
          type="button"
          onClick={toggleSourceMode}
          className={`rounded px-2 py-1.5 text-xs font-medium ${
            sourceMode
              ? "bg-amber-500 text-neutral-900"
              : "bg-neutral-700 text-neutral-100 hover:bg-neutral-600"
          }`}
        >
          {sourceMode ? "시각 편집" : "HTML"}
        </button>
        <span className="mx-1 h-5 w-px bg-neutral-600" aria-hidden />

        {!sourceMode && editor ? (
          <>
            <select
              value={headingSelectValue}
              onChange={(e) => {
                const v = e.target.value;
                const chain = editor.chain().focus();
                if (v === "p") chain.setParagraph().run();
                if (v === "h1") chain.toggleHeading({ level: 1 }).run();
                if (v === "h2") chain.toggleHeading({ level: 2 }).run();
                if (v === "h3") chain.toggleHeading({ level: 3 }).run();
              }}
              className="rounded border-0 bg-neutral-700 py-1.5 pl-2 pr-6 text-xs text-neutral-100"
              aria-label="제목 단계"
            >
              <option value="p">본문</option>
              <option value="h1">제목 1</option>
              <option value="h2">제목 2</option>
              <option value="h3">제목 3</option>
            </select>

            <ToolBtn
              title="굵게"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              B
            </ToolBtn>
            <ToolBtn
              title="기울임"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              I
            </ToolBtn>
            <ToolBtn
              title="취소선"
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              S
            </ToolBtn>
            <ToolBtn
              title="밑줄"
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              U
            </ToolBtn>
            <ToolBtn
              title="코드"
              active={editor.isActive("code")}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              {"</>"}
            </ToolBtn>

            <span className="mx-1 h-5 w-px bg-neutral-600" aria-hidden />

            <ToolBtn
              title="글머리"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              •
            </ToolBtn>
            <ToolBtn
              title="번호"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              1.
            </ToolBtn>
            <ToolBtn
              title="인용"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              ❝
            </ToolBtn>
            <ToolBtn
              title="구분선"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              —
            </ToolBtn>

            <span className="mx-1 h-5 w-px bg-neutral-600" aria-hidden />

            {(["left", "center", "right", "justify"] as const).map((a) => (
              <ToolBtn
                key={a}
                title={`정렬 ${a}`}
                active={editor.isActive({ textAlign: a })}
                onClick={() => editor.chain().focus().setTextAlign(a).run()}
              >
                {a === "left"
                  ? "좌"
                  : a === "center"
                    ? "중"
                    : a === "right"
                      ? "우"
                      : "양"}
              </ToolBtn>
            ))}

            <span className="mx-1 h-5 w-px bg-neutral-600" aria-hidden />

            <ToolBtn
              onClick={() => {
                const prev = editor.getAttributes("link").href as
                  | string
                  | undefined;
                const url = window.prompt("링크 URL", prev ?? "https://");
                if (url === null) return;
                if (url === "") {
                  editor.chain().focus().unsetLink().run();
                  return;
                }
                editor.chain().focus().setLink({ href: url }).run();
              }}
            >
              링크
            </ToolBtn>
            <ToolBtn onClick={() => fileInputRef.current?.click()}>
              이미지
            </ToolBtn>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        ) : (
          <span className="px-2 text-xs text-neutral-400">
            HTML 모드에서는 텍스트로 직접 수정합니다. 「시각 편집」으로
            미리보기합니다.
          </span>
        )}
      </div>

      {sourceMode ? (
        <textarea
          value={htmlBuffer}
          onChange={(e) => setHtmlBuffer(e.target.value)}
          spellCheck={false}
          className="min-h-[320px] w-full resize-y bg-neutral-950 px-4 py-3 font-mono text-xs leading-relaxed text-emerald-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500/40"
          aria-label="HTML 소스"
        />
      ) : (
        <div className="bg-neutral-900">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}

function ToolBtn({
  children,
  title,
  active,
  onClick,
}: {
  children: ReactNode;
  title?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`min-w-[1.75rem] rounded px-2 py-1.5 text-xs font-medium ${
        active
          ? "bg-neutral-200 text-neutral-900"
          : "bg-neutral-700 text-neutral-100 hover:bg-neutral-600"
      }`}
    >
      {children}
    </button>
  );
}
