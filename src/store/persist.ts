import { APP_CONFIG } from '../config/wheelConfig'

function storageKey(name: string): string {
  return `${APP_CONFIG.storageKeyPrefix}${name}`
}

export function loadPersisted<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(name))
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function savePersisted<T>(name: string, value: T): void {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(value))
  } catch {
    // localStorage unavailable (private mode / quota) — state just won't survive a reload.
  }
}
