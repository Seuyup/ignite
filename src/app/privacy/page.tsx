import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  {
    title: "개인정보 처리방침",
    body: `IGNITE(이하 "회사")는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.`,
  },
  {
    title: "수집하는 개인정보 항목",
    body: `회사는 문의 접수 및 상담을 위해 아래와 같은 개인정보를 수집하고 있습니다.\n\n• 필수 항목: 이름, 이메일\n• 선택 항목: 문의 내용\n\n개인정보 수집 방법: 웹사이트 내 문의 양식(Contact Form)`,
  },
  {
    title: "개인정보의 수집 및 이용 목적",
    body: `수집한 개인정보는 다음의 목적을 위해 활용됩니다.\n\n• 프로젝트 문의에 대한 회신 및 상담 일정 조율\n• 채용 관련 문의 처리\n• 서비스 관련 공지사항 전달`,
  },
  {
    title: "개인정보의 보유 및 이용 기간",
    body: `회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.\n\n• 문의 접수 관련 정보: 문의 처리 완료 후 30일 이내 파기\n• 단, 관계 법령에 의해 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보존합니다.`,
  },
  {
    title: "개인정보의 제3자 제공",
    body: `회사는 정보주체의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.\n\n• 정보주체가 사전에 동의한 경우\n• 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우`,
  },
  {
    title: "개인정보의 파기 절차 및 방법",
    body: `회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.\n\n• 전자적 파일 형태: 복구 및 재생이 불가능한 방법으로 영구 삭제\n• 기록물, 인쇄물 등: 파쇄 또는 소각`,
  },
  {
    title: "정보주체의 권리·의무 및 행사 방법",
    body: `정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.\n\n• 개인정보 열람 요구\n• 오류 등이 있을 경우 정정 요구\n• 삭제 요구\n• 처리 정지 요구\n\n위 권리 행사는 이메일(ignite2403@gmail.com)을 통해 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.`,
  },
  {
    title: "개인정보의 안전성 확보 조치",
    body: `회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.\n\n• 개인정보 접근 제한: 개인정보를 처리하는 담당자를 최소한으로 제한\n• 해킹 등에 대비한 기술적 대책: SSL 등 보안 프로토콜을 통한 데이터 암호화 전송\n• 개인정보 처리 시스템 접근 권한 관리`,
  },
  {
    title: "개인정보 보호 책임자",
    body: `회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해 구제 등을 위하여 아래와 같이 개인정보 보호 책임자를 지정하고 있습니다.\n\n• 이메일: ignite2403@gmail.com`,
  },
  {
    title: "개인정보 처리방침 변경",
    body: `이 개인정보 처리방침은 2024년 1월 1일부터 적용됩니다. 법령이나 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 웹사이트를 통해 공지하겠습니다.`,
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100dvh-72px)]">
      <div className="flex flex-col px-6 py-16 md:flex-row md:px-10 md:py-24 lg:px-[90px]">
        {/* Left - label */}
        <div className="hidden md:block md:flex-1">
          <h1 className="text-sm font-medium text-neutral-900 md:sticky md:top-[25vh]">
            개인정보 처리방침
          </h1>
        </div>

        {/* Right - content */}
        <div className="w-full md:w-[55%] md:max-w-[680px] md:flex-shrink-0 md:mr-[15%]">
          <div className="space-y-12">
            {SECTIONS.map((section, idx) => (
              <section key={idx}>
                <h2 className="mb-4 border-b border-neutral-900 pb-2 text-sm font-medium text-neutral-900">
                  {section.title}
                </h2>
                <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-neutral-900">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
