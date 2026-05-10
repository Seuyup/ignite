export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-xs uppercase tracking-[0.14em] text-neutral-500 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()}, ignite</p>
        <p className="text-neutral-400">All Rights Reserved.</p>
      </div>
    </footer>
  );
}
