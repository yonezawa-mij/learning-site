import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-20 pb-16">
      <p className="mb-4 text-sm font-medium tracking-wide text-accent uppercase">
        オンライン学習
      </p>
      <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
        自分のペースで、
        <br />
        学びを始めよう。
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
        実践的なコースと教材で、スキルを一歩ずつ積み上げる。
        まずは無料コンテンツから、気軽にスタートできます。
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="#courses"
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          コースを見る
        </Link>
        <Link
          href="#about"
          className="rounded-full border border-border bg-white px-6 py-3 text-sm font-medium text-foreground hover:bg-stone-50 transition-colors"
        >
          詳しく知る
        </Link>
      </div>
    </section>
  );
}
