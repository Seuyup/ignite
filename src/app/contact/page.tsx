import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-[180px_1fr]">
        <h1 className="text-sm font-light text-neutral-500">Contact</h1>

        <div className="space-y-12">
          <p className="max-w-xl text-sm leading-relaxed text-neutral-700">
            프로젝트를 논의하고 싶으시다면, 전화를 주시거나 아래 양식을 작성해
            주세요. 가능한 빨리 상담 일정을 잡아드리겠습니다. 채용을 원하시는
            경우, PDF 형식의 포트폴리오와 이력서를 아래 이메일로 보내주세요.
          </p>

          <form className="max-w-xl space-y-8">
            <div>
              <input
                type="text"
                placeholder="Name"
                className="w-full border-b border-neutral-300 bg-transparent py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full border-b border-neutral-300 bg-transparent py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
              />
            </div>
            <div>
              <textarea
                rows={6}
                className="w-full resize-none border border-neutral-300 bg-transparent p-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
              />
            </div>
            <div>
              <button
                type="submit"
                className="border border-neutral-900 px-6 py-2 text-sm text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                Send
              </button>
            </div>
          </form>

          <div className="space-y-6 pt-4">
            <div className="text-sm leading-relaxed text-neutral-700">
              <p>서울특별시 강남구</p>
              <p>대한민국</p>
            </div>            
          </div>
        </div>
      </div>
    </section>
  );
}
