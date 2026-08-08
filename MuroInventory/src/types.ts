export interface TodaySummary {
  day: string
  inicio: number
  llegadas: number
  usos: number
  salidas: number
  quedo: number
}

export interface Movement {
  id: number
  day: string
  type: 'llegada' | 'uso' | 'salida'
  sacks: number
  tortilleria_id: number
  destination_tortilleria_id: number | null
  destination_name: string | null
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

export type UserRole = 'admin' | 'user' | 'super'

export interface UserRef {
  id: number
  name: string
  role: 'admin' | 'user'
}

export interface Me {
  id: number
  name: string
  role: UserRole
  tortillerias: Tortilleria[]
}
