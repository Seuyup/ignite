"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type FormStatus = "idle" | "loading" | "success" | "error";

export function ContactForm() {
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
      setErrorMessage(
        "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
  }

  if (status === "success") {
    return (
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
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border-b border-neutral-900 bg-transparent py-3 text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-900 focus:border-neutral-900"
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-b border-neutral-900 bg-transparent py-3 text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-900 focus:border-neutral-900"
        />
      </div>
      <div>
        <textarea
          rows={6}
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-none border border-neutral-900 bg-transparent p-4 text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-900 focus:border-neutral-900"
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
          href="/p/privacy"
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
  );
}
