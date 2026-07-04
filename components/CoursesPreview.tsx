export function CoursesPreview() {
  return (
    <section id="courses" className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">コース</h2>
        <p className="mt-3 text-muted">準備中 — 近日公開予定です。</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="flex flex-col rounded-2xl border border-dashed border-border bg-stone-50/50 p-8"
            >
              <span className="text-xs font-medium text-muted uppercase tracking-wide">
                Coming soon
              </span>
              <h3 className="mt-2 text-lg font-semibold text-stone-400">コース {n}</h3>
              <p className="mt-2 text-sm text-stone-400">内容は後から追加します</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
