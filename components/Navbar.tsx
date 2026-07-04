import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          Learning
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="#courses" className="hover:text-foreground transition-colors">
            コース
          </Link>
          <Link href="#about" className="hover:text-foreground transition-colors">
            について
          </Link>
          <Link
            href="#contact"
            className="rounded-full bg-foreground px-4 py-2 text-white hover:bg-stone-800 transition-colors"
          >
            お問い合わせ
          </Link>
        </nav>
      </div>
    </header>
  );
}
