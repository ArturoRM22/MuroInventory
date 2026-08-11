export const API_URL: string = import.meta.env.VITE_API_URL ?? ''

export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${API_URL}${path}`
}
