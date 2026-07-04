export function Footer() {
  return (
    <footer id="contact" className="border-t border-border bg-white py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold text-foreground">Learning</p>
          <p className="mt-1 text-sm text-muted">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
        <a
          href="mailto:hello@example.com"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          hello@example.com
        </a>
      </div>
    </footer>
  );
}
