type Props = {
  title: string
  description?: string
  eyebrow?: string
}

export function PageHeader({ title, description, eyebrow }: Props) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">{eyebrow}</p>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && <p className="mt-2 text-muted max-w-2xl">{description}</p>}
    </div>
  )
}
