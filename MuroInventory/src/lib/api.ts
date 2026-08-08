export function getJSON(url: string): Promise<any | null> {
  if (!sessionStorage.getItem('user')) {
    window.location.href = '/login'
    return Promise.resolve(null)
  }

  return fetch(url, { credentials: 'include' })
    .then((res) => {
      if (res.status === 401) {
        sessionStorage.removeItem('user')
        window.location.href = '/login'
        return null
      }
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return res.json()
    })
    .then((json) => (json ? json.data : null))
}

export function deleteJSON(url: string): Promise<void> {
  return fetch(url, { method: 'DELETE', credentials: 'include' }).then((res) => {
    if (res.status === 401) {
      sessionStorage.removeItem('user')
      window.location.href = '/login'
      return
    }
    if (res.status === 204) return
    return res.json().then((body) => {
      throw new Error(body?.error || `Error ${res.status}`)
    })
  })
}

export function sendJSON(
  method: 'POST' | 'PATCH',
  url: string,
  body: Record<string, unknown>
): Promise<any> {
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      if (res.status === 401) {
        sessionStorage.removeItem('user')
        window.location.href = '/login'
        return null
      }
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`)
      return json ? json.data : null
    })
}
