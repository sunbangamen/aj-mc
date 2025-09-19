// Lightweight debug logger
// Enable by setting VITE_DEBUG_LOGS=true in .env (only effective in dev)

export const isDebug = Boolean(import.meta?.env?.DEV) &&
  String(import.meta?.env?.VITE_DEBUG_LOGS || '').toLowerCase() === 'true'

export const debug = (...args) => {
  if (isDebug) console.log(...args)
}

export const warn = (...args) => {
  if (isDebug) console.warn(...args)
}

// Always keep errors visible
export const error = (...args) => console.error(...args)

