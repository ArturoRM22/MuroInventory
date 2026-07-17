interface SummaryCardProps {
  label: string
  value: number
  accent?: string
}

export default function SummaryCard({ label, value, accent }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold" style={{ color: accent ?? 'inherit' }}>
        {value}
      </p>
    </div>
  )
}
