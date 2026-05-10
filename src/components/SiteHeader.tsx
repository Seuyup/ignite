import Link from "next/link";
import { mainNav } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-start md:justify-between md:py-10">
        <Link
          href="/"
          className="text-xl font-medium tracking-tight text-neutral-900 transition-opacity hover:opacity-70"
        >
          WGNB
        </Link>
        <nav aria-label="Primary">
          <ul className="flex flex-col gap-2 text-sm uppercase tracking-[0.12em] text-neutral-600 md:flex-row md:flex-wrap md:justify-end md:gap-x-6 md:gap-y-2">
            {mainNav.map((item) => (
              <li key={item.href + item.label}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-neutral-900"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-neutral-900"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
