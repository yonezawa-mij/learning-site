type Props = {
  label: string
  value: string
  hint?: string
  icon?: string
}

export function StatCard({ label, value, hint, icon }: Props) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
          {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
        </div>
        {icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-lg">
            {icon}
          </span>
        )}
      </div>
    </div>
  )
}
