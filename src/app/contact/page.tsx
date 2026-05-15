"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type FormStatus = "idle" | "loading" | "success" | "error";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name || !email || !message) {
      setStatus("error");
      setErrorMessage("모든 필드를 입력해주세요.");
      return;
    }

    if (!agreed) {
      setStatus("error");
      setErrorMessage("개인정보 보호에 동의해주세요.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "전송에 실패했습니다.");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
      setAgreed(false);
    } catch {
      setStatus("error");
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <div className="min-h-[calc(100dvh-72px)]">
      <div className="flex flex-col px-6 py-16 md:flex-row md:px-10 md:py-24 lg:px-[90px]">
        {/* Left - label */}
        <div className="mb-10 md:mb-0 md:flex-1">
          <h1 className="text-sm font-medium text-neutral-900 md:sticky md:top-[25vh]">
            Contact
          </h1>
        </div>

        {/* Right - content */}
        <div className="w-full md:w-[55%] md:max-w-[680px] md:flex-shrink-0 md:mr-[15%]">
          <div className="space-y-10">
            <p className="text-sm font-medium leading-relaxed text-neutral-900">
              프로젝트를 논의하고 싶으시다면, 전화를 주시거나 아래 양식을 작성해
              주세요. 가능한 빨리 상담 일정을 잡아드리겠습니다. 채용을 원하시는
              경우, PDF 형식의 포트폴리오와 이력서를 아래 이메일로 보내주세요.
            </p>

            {status === "success" ? (
              <div className="border border-neutral-300 p-6">
                <p className="text-sm font-medium text-neutral-900">
                  메시지가 성공적으로 전송되었습니다.
                </p>
                <p className="mt-2 text-sm text-neutral-600">
                  빠른 시일 내에 답변 드리겠습니다.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-4 border border-neutral-900 px-6 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
                >
                  새 메시지 작성
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-b border-neutral-300 bg-transparent py-3 text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-900 focus:border-neutral-900"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b border-neutral-300 bg-transparent py-3 text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-900 focus:border-neutral-900"
                  />
                </div>
                <div>
                  <textarea
                    rows={6}
                    placeholder="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-none border border-neutral-300 bg-transparent p-4 text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-900 focus:border-neutral-900"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="h-4 w-4 border border-neutral-400 bg-transparent accent-neutral-900"
                  />
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-sm font-medium text-neutral-900 underline underline-offset-2"
                  >
                    개인정보 보호에 동의합니다
                  </Link>
                </label>

                {status === "error" && errorMessage && (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="border border-neutral-900 px-6 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === "loading" ? "전송 중..." : "Send"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
