const SECURITY_LOGS_KEY = 'rentixautos.security.logs'
const MAX_LOG_ENTRIES = 200

function readLogs() {
  try {
    const raw = localStorage.getItem(SECURITY_LOGS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistLogs(logs) {
  localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(logs.slice(-MAX_LOG_ENTRIES)))
}

export function logSecurityEvent(event) {
  const entry = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    ...event,
  }

  const logs = readLogs()
  logs.push(entry)
  persistLogs(logs)

  const level = event.level ?? 'info'
  const prefix = `[Security:${level.toUpperCase()}]`
  if (level === 'error' || level === 'warn') {
    console.warn(prefix, entry)
  } else {
    console.info(prefix, entry)
  }

  return entry
}

export function getSecurityLogs() {
  return readLogs()
}

export function clearSecurityLogs() {
  localStorage.removeItem(SECURITY_LOGS_KEY)
}
