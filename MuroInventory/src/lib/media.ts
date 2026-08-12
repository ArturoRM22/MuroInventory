import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', onChange)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function isStandalone(): boolean {
  return (
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

export function useStandalone(): boolean {
  const mq = useMediaQuery('(display-mode: standalone)')
  return mq || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}