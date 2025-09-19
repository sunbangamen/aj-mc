import { useCallback, useEffect, useRef, useState } from 'react'

// Throttled state setter for high-frequency updates
// Returns: [state, setThrottled, setImmediate]
export function useThrottledState(initialValue, interval = 150) {
  const [state, setState] = useState(initialValue)
  const lastRef = useRef(0)
  const timerRef = useRef(null)
  const latestRef = useRef(initialValue)

  const flush = useCallback(() => {
    setState(latestRef.current)
    lastRef.current = Date.now()
    timerRef.current = null
  }, [])

  const setThrottled = useCallback(
    next => {
      const nextValue = typeof next === 'function' ? next(latestRef.current) : next
      latestRef.current = nextValue

      const now = Date.now()
      const elapsed = now - lastRef.current

      if (elapsed >= interval) {
        flush()
      } else {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(flush, Math.max(0, interval - elapsed))
      }
    },
    [interval, flush]
  )

  const setImmediate = useCallback(value => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    latestRef.current = typeof value === 'function' ? value(latestRef.current) : value
    flush()
  }, [flush])

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), [])

  return [state, setThrottled, setImmediate]
}

