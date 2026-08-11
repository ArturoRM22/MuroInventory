interface SummaryCardProps {
  label: string
  value: number
  accent?: string
}

export default function SummaryCard({ label, value, accent }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold md:text-3xl" style={{ color: accent ?? 'inherit' }}>
        {value}
      </p>
    </div>
  )
}
