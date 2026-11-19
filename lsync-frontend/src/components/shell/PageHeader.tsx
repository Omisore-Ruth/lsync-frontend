export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <>
      {/* React 19 moves <title> into <head>, so every page gets its own tab title without a server wrapper */}
      <title>{`${title} | LSync`}</title>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-6 py-5 sm:px-8">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        {children}
      </header>
    </>
  );
}
