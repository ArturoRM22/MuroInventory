import { useTortilleria } from '../context/tortilleria'

export default function TortilleriaSidebar() {
  const { tortillerias, current, loading, setCurrent } = useTortilleria()

  return (
    <aside className="w-52 shrink-0 border-r border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Tortillerías
      </h2>

      <select
        value={current?.id ?? ''}
        onChange={(e) => setCurrent(Number(e.target.value))}
        className="mb-2 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 md:hidden"
      >
        {tortillerias.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : (
        <ul className="hidden md:block">
          {tortillerias.map((t) => (
            <li key={t.id} className="mb-1">
              <button
                onClick={() => setCurrent(t.id)}
                className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition ${
                  current?.id === t.id
                    ? 'bg-blue-600 font-medium text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
