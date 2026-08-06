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
