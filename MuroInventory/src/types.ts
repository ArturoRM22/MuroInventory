export interface TodaySummary {
  day: string
  inicio: number
  llegadas: number
  usos: number
  quedo: number
}

export interface Movement {
  id: number
  day: string
  type: 'llegada' | 'uso'
  sacks: number
  tortilleria_id: number
  employee_name: string
  created_by: number
  created_at: string
}
