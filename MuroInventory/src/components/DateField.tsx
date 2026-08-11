import DatePicker from 'react-datepicker'
import { es } from 'date-fns/locale'
import { useMediaQuery } from '../lib/media'

interface DateFieldProps {
  id: string
  value: string
  onChange: (iso: string) => void
  required?: boolean
  className?: string
}

function isoToDate(iso: string): Date | null {
  if (!iso) return null
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function dateToIso(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DateField({ id, value, onChange, required, className }: DateFieldProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')

  return (
    <DatePicker
      id={id}
      selected={isoToDate(value)}
      onChange={(date: Date | null) => onChange(date ? dateToIso(date) : '')}
      dateFormat="dd/MM/yyyy"
      locale={es}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      required={required}
      placeholderText="dd/mm/aaaa"
      autoComplete="off"
      withPortal={isMobile}
      className={className}
    />
  )
}
