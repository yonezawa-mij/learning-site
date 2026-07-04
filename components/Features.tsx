const features = [
  {
    title: "段階的なカリキュラム",
    description: "基礎から応用まで、順番に学べる構成。迷わず進められます。",
  },
  {
    title: "実践ベース",
    description: "読むだけでなく、手を動かして身につける内容を中心にしています。",
  },
  {
    title: "いつでも再開",
    description: "自分のペースで進められ、途中からでもすぐに続きができます。",
  },
];

export function Features() {
  return (
    <section id="about" className="border-t border-border bg-white py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          このサイトについて
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          学習を続けやすい環境を目指しています。コンテンツは順次追加予定です。
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {features.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border p-6">
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
