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

export interface Tortilleria {
  id: number
  name: string
  is_main: boolean
  main_tortilleria_id: number | null
  initial_stock: number
}

export interface Me {
  id: number
  name: string
  role: 'admin' | 'user'
  tortillerias: Tortilleria[]
}
