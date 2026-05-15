"use client";

import { AdminImageUploadOverlay } from "@/components/admin/AdminImageUploadOverlay";
import { EditorImageSidebar } from "@/components/admin/EditorImageSidebar";
import {
  ADMIN_UPLOAD_MAX_BYTES,
  ADMIN_UPLOAD_MAX_LABEL,
} from "@/lib/admin-upload";
import {
  postAdminImageUpload,
  type AdminUploadProgress,
} from "@/lib/admin-upload-xhr";
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
  useReducer,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

type Props = {
  getHtmlRef: MutableRefObject<() => string>;
  initialHtml?: string;
};

function IconAlignLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5.5h16M4 9.5h10M4 13.5h16M4 17.5h8"
      />
    </svg>
  );
}

function IconAlignCenter({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5.5h16M7 9.5h10M4 13.5h16M9 17.5h6"
      />
    </svg>
  );
}

function IconAlignRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5.5h16M10 9.5h10M4 13.5h16M12 17.5h8"
      />
    </svg>
  );
}

function IconAlignJustify({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5.5h16M4 9.5h16M4 13.5h16M4 17.5h16"
      />
    </svg>
  );
}

function IconLink({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
      />
    </svg>
  );
}

function IconPhoto({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5v10.5H3.75V6.75z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.25 14.25 2.121-2.121a1.5 1.5 0 012.121 0l2.121 2.121M9 8.25h.008v.008H9V8.25z"
      />
    </svg>
  );
}

const ALIGN_ICONS = {
  left: IconAlignLeft,
  center: IconAlignCenter,
  right: IconAlignRight,
  justify: IconAlignJustify,
} as const;

const ALIGN_LABELS: Record<"left" | "center" | "right" | "justify", string> = {
  left: "텍스트 왼쪽 정렬",
  center: "텍스트 가운데 정렬",
  right: "텍스트 오른쪽 정렬",
  justify: "텍스트 양쪽 정렬",
};

type EditorMode = "html" | "preview" | "visual";

export function ProjectHtmlEditor({
  getHtmlRef,
  initialHtml = "",
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<EditorMode>("html");
  const [htmlBuffer, setHtmlBuffer] = useState(initialHtml);
  const [uploadProgress, setUploadProgress] =
    useState<AdminUploadProgress | null>(null);

  const imageUploadBusy = uploadProgress !== null;

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
          class: "text-sky-700 underline underline-offset-2",
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
          "prose prose-neutral max-w-none min-h-[280px] px-4 py-3 text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  /* ── 모드 전환 ── */

  const switchToVisual = () => {
    if (!editor) return;
    const ok = window.confirm(
      "시각 편집 모드로 전환하면 HTML이 에디터 형식으로 간소화될 수 있습니다.\n" +
        "일부 속성이나 스타일이 제거될 수 있으며, 이 변경은 되돌릴 수 없습니다.\n\n" +
        "전환하시겠습니까?",
    );
    if (!ok) return;
    editor.commands.setContent(htmlBuffer, { emitUpdate: true });
    setMode("visual");
  };

  const switchToHtml = () => {
    if (mode === "visual" && editor) {
      setHtmlBuffer(editor.getHTML());
    }
    setMode("html");
  };

  const togglePreview = () => {
    setMode((prev) => (prev === "preview" ? "html" : "preview"));
  };

  /* ── getHtmlRef: 폼 제출 시 현재 HTML 반환 ── */

  useEffect(() => {
    getHtmlRef.current = () => {
      if (mode === "visual") return editor?.getHTML() ?? "";
      return htmlBuffer;
    };
  }, [editor, mode, htmlBuffer, getHtmlRef]);

  /* ── 이미지 업로드 (시각 모드 전용) ── */

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const raw = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!raw.length || !editor || mode !== "visual") return;

    const validFiles: File[] = [];
    for (const f of raw) {
      if (f.size > ADMIN_UPLOAD_MAX_BYTES) {
        window.alert(
          `「${f.name}」은(는) ${ADMIN_UPLOAD_MAX_LABEL}을(를) 초과합니다. (${(f.size / (1024 * 1024)).toFixed(1)}MB)`,
        );
        continue;
      }
      validFiles.push(f);
    }
    if (!validFiles.length) return;

    const total = validFiles.length;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const batchIndex = i + 1;

      try {
        setUploadProgress({
          phase: "uploading",
          loaded: 0,
          total: file.size,
          batchIndex,
          batchTotal: total,
        });
        const result = await postAdminImageUpload(file, (p) =>
          setUploadProgress({
            ...p,
            batchIndex,
            batchTotal: total,
          }),
        );
        if (!result.ok) {
          window.alert(
            result.error ??
              `「${file.name}」 업로드에 실패했습니다. 다음 파일로 계속합니다.`,
          );
          continue;
        }
        editor.chain().focus().setImage({ src: result.url }).run();
      } catch (err) {
        const msg =
          err instanceof Error
            ? `「${file.name}」 업로드 중 오류: ${err.message}`
            : `「${file.name}」 업로드 중 알 수 없는 오류가 발생했습니다.`;
        window.alert(msg);
      }
    }

    setUploadProgress(null);
  };

  /* ── 시각 모드 도구 모음용 상태 ── */

  const headingSelectValue = (() => {
    if (!editor) return "p";
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    return "p";
  })();

  const [, bumpVisualHtml] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!editor || mode !== "visual") return;
    const onDocChange = () => bumpVisualHtml();
    editor.on("transaction", onDocChange);
    editor.on("create", onDocChange);
    onDocChange();
    return () => {
      editor.off("transaction", onDocChange);
      editor.off("create", onDocChange);
    };
  }, [editor, mode]);

  /* ── 이미지 사이드바 연동 ── */

  const bodyHtmlForImages =
    mode === "visual" ? (editor?.getHTML() ?? "") : htmlBuffer;

  const applyBodyHtmlFromSidebar = useCallback(
    (next: string) => {
      if (mode === "visual" && editor) {
        editor.chain().focus().setContent(next, { emitUpdate: true }).run();
      } else {
        setHtmlBuffer(next);
      }
    },
    [editor, mode],
  );

  /* ── 렌더 ── */

  const isHtmlLike = mode === "html" || mode === "preview";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-sm">
        <AdminImageUploadOverlay progress={uploadProgress} />

        {/* ── 도구 모음 ── */}
        <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-100 px-2 py-2">
          {/* 모드 전환 탭 */}
          <button
            type="button"
            onClick={() => {
              if (isHtmlLike) switchToVisual();
            }}
            className={`rounded-md border px-2 py-1.5 text-xs font-medium ${
              mode === "visual"
                ? "border-sky-500 bg-sky-500 text-white"
                : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            시각 편집
          </button>
          <button
            type="button"
            onClick={() => {
              if (mode === "visual") switchToHtml();
            }}
            className={`rounded-md border px-2 py-1.5 text-xs font-medium ${
              isHtmlLike
                ? "border-amber-500 bg-amber-500 text-neutral-900"
                : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            HTML
          </button>

          <span className="mx-1 h-5 w-px bg-neutral-300" aria-hidden />

          {mode === "visual" && editor ? (
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
                className="rounded-md border border-neutral-300 bg-white py-1.5 pl-2 pr-6 text-xs text-neutral-900"
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

              <span className="mx-1 h-5 w-px bg-neutral-300" aria-hidden />

              <ToolBtn
                title="글머리"
                active={editor.isActive("bulletList")}
                onClick={() =>
                  editor.chain().focus().toggleBulletList().run()
                }
              >
                •
              </ToolBtn>
              <ToolBtn
                title="번호"
                active={editor.isActive("orderedList")}
                onClick={() =>
                  editor.chain().focus().toggleOrderedList().run()
                }
              >
                1.
              </ToolBtn>
              <ToolBtn
                title="인용"
                active={editor.isActive("blockquote")}
                onClick={() =>
                  editor.chain().focus().toggleBlockquote().run()
                }
              >
                ❝
              </ToolBtn>
              <ToolBtn
                title="구분선"
                onClick={() =>
                  editor.chain().focus().setHorizontalRule().run()
                }
              >
                —
              </ToolBtn>

              <span className="mx-1 h-5 w-px bg-neutral-300" aria-hidden />

              {(["left", "center", "right", "justify"] as const).map((a) => {
                const Icon = ALIGN_ICONS[a];
                return (
                  <ToolBtn
                    key={a}
                    title={ALIGN_LABELS[a]}
                    active={editor.isActive({ textAlign: a })}
                    onClick={() =>
                      editor.chain().focus().setTextAlign(a).run()
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </ToolBtn>
                );
              })}

              <span className="mx-1 h-5 w-px bg-neutral-300" aria-hidden />

              <ToolBtn
                title="링크 URL 넣기·수정 (빈 값이면 링크 제거)"
                ariaLabel="링크"
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
                <IconLink className="h-4 w-4" />
              </ToolBtn>
              <ToolBtn
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploadBusy}
                title={
                  imageUploadBusy
                    ? "이미지 업로드 처리 중…"
                    : "이미지 삽입 (여러 장 선택 가능)"
                }
                ariaLabel="이미지 삽입"
              >
                <IconPhoto
                  className={`h-4 w-4 ${imageUploadBusy ? "animate-pulse opacity-70" : ""}`}
                />
              </ToolBtn>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={togglePreview}
                className={`rounded-md border px-2 py-1.5 text-xs font-medium ${
                  mode === "preview"
                    ? "border-violet-500 bg-violet-500 text-white"
                    : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                {mode === "preview" ? "편집으로 돌아가기" : "미리보기"}
              </button>
              <span className="px-2 text-xs text-neutral-500">
                {mode === "preview"
                  ? "읽기 전용 미리보기입니다."
                  : "HTML 소스를 직접 편집합니다. 저장 시 그대로 저장됩니다."}
              </span>
            </>
          )}
        </div>

        {/* ── 에디터 영역 ── */}
        {mode === "visual" ? (
          <div className="min-h-[280px] rounded-b-xl border-t border-neutral-200 bg-white">
            <EditorContent editor={editor} />
          </div>
        ) : mode === "preview" ? (
          <div className="min-h-[280px] rounded-b-xl border-t border-neutral-200 bg-white px-4 py-3">
            <div
              className="prose prose-neutral max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-p:text-neutral-600 prose-a:text-neutral-900 prose-img:rounded"
              dangerouslySetInnerHTML={{ __html: htmlBuffer }}
            />
          </div>
        ) : (
          <textarea
            value={htmlBuffer}
            onChange={(e) => setHtmlBuffer(e.target.value)}
            spellCheck={false}
            className="min-h-[320px] w-full resize-y rounded-b-xl border-t border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-xs leading-relaxed text-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-400/60"
            aria-label="HTML 소스"
          />
        )}
      </div>
      {editor ? (
        <EditorImageSidebar
          bodyHtml={bodyHtmlForImages}
          onBodyHtmlChange={applyBodyHtmlFromSidebar}
        />
      ) : null}
    </div>
  );
}

function ToolBtn({
  children,
  title,
  ariaLabel,
  active,
  onClick,
  disabled,
}: {
  children: ReactNode;
  title?: string;
  ariaLabel?: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const label = ariaLabel ?? title;
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-[1.75rem] min-w-[1.75rem] items-center justify-center rounded-md border px-1.5 py-1.5 text-xs font-medium ${
        disabled
          ? "cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-40"
          : active
            ? "border-neutral-800 bg-neutral-900 text-white"
            : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
      }`}
    >
      {children}
    </button>
  );
}
