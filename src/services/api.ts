export type Toilet = {
  id: string
  name: string
  area: string
  status: string
  trackerInstalled: boolean
  lastCleaned: string
  gpsCoords: [number, number]
  description?: string
  provider?: string
}

export type Cleaning = {
  id?: string
  toiletId: string
  providerId: string
  timestamp: string
  status?: string
  flagged?: boolean
  aiScore?: number
  gps?: [number, number] | null
  notes?: string
  beforePhotoBase64?: string
  afterPhotoBase64?: string
}

export type User = {
  id: string
  name: string
  role: 'provider' | 'admin'
  username?: string
  password?: string
  assignedToilets?: string[]
  rating?: number
  totalCleaned?: number
}

const MOCK_BASE = '/mockData'

async function fetchJson<T>(path: string, cacheKey: string, forceRefresh = false): Promise<T> {
  const storageKey = `cache_${cacheKey}`
  if (!forceRefresh) {
    const cached = localStorage.getItem(storageKey)
    if (cached) {
      try {
        const { timestamp, data } = JSON.parse(cached)
        // 10 minutes TTL
        if (Date.now() - timestamp < 10 * 60 * 1000) {
          return data as T
        }
      } catch {}
    }
  }

  const res = await fetch(`${MOCK_BASE}/${path}`)
  if (!res.ok) throw new Error(`Failed to fetch ${path}`)
  const data = (await res.json()) as T
  try {
    localStorage.setItem(storageKey, JSON.stringify({ timestamp: Date.now(), data }))
  } catch {}
  return data
}

function getLocalToilets(): Toilet[] {
  try {
    return JSON.parse(localStorage.getItem('admin_mt_toilets') || '[]')
  } catch {
    return []
  }
}

export async function getToilets(forceRefresh = false): Promise<Toilet[]> {
  const base = await fetchJson<Toilet[]>('toilets.json', 'toilets', forceRefresh)
  const local = getLocalToilets()
  // Merge by id, prefer local entries
  const byId = new Map<string, Toilet>()
  base.forEach(t => byId.set(t.id, t))
  local.forEach(t => byId.set(t.id, t))
  return Array.from(byId.values())
}

export async function getCleanings(forceRefresh = false): Promise<Cleaning[]> {
  return fetchJson<Cleaning[]>('cleanings.json', 'cleanings', forceRefresh)
}

export async function getUsers(forceRefresh = false): Promise<User[]> {
  return fetchJson<User[]>('users.json', 'users', forceRefresh)
}

export async function getUsersWithLocal(): Promise<User[]> {
  const base = await getUsers()
  let local: User[] = []
  try {
    local = JSON.parse(localStorage.getItem('admin_dm_users') || '[]')
  } catch {}
  // Merge by id or email if present; prefer local entries
  const byKey = new Map<string, User>()
  base.forEach(u => {
    const key = (u as any).email || u.id
    byKey.set(key, u as any)
  })
  local.forEach(u => {
    const key = (u as any).email || u.id
    byKey.set(key, u as any)
  })
  return Array.from(byKey.values()) as any
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('Request timed out')), ms)
    promise
      .then((value) => {
        clearTimeout(id)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(id)
        reject(err)
      })
  })
}

export async function submitCleaning(cleaning: Cleaning): Promise<{ ok: boolean; offline?: boolean }>
{
  try {
    const controller = new AbortController()
    const res = await withTimeout(
      fetch('http://localhost:4000/cleanings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaning),
        signal: controller.signal,
      }),
      4000
    )

    if (!res.ok) throw new Error('Bad response')
    return { ok: true }
  } catch {
    // Offline fallback: queue locally
    const key = 'pending_cleanings'
    const queue: Cleaning[] = JSON.parse(localStorage.getItem(key) || '[]')
    queue.push({ ...cleaning, id: cleaning.id || `local_${Date.now()}` })
    localStorage.setItem(key, JSON.stringify(queue))
    return { ok: true, offline: true }
  }
}

export function getPendingCleanings(): Cleaning[] {
  try {
    return JSON.parse(localStorage.getItem('pending_cleanings') || '[]')
  } catch {
    return []
  }
}

export function clearPendingCleanings() {
  localStorage.removeItem('pending_cleanings')
}

export type ProviderAssignments = Record<string, string[]> // providerId -> toiletIds

export async function getProviderAssignments(): Promise<ProviderAssignments> {
  // Try local override first
  const local = localStorage.getItem('providerAssignments')
  if (local) {
    try { return JSON.parse(local) } catch {}
  }
  // Derive from users mock
  const users = await getUsers()
  const assignments: ProviderAssignments = {}
  users.filter(u => u.role === 'provider').forEach(u => {
    assignments[u.id] = u.assignedToilets || []
  })
  return assignments
}

export function saveProviderAssignments(assignments: ProviderAssignments) {
  localStorage.setItem('providerAssignments', JSON.stringify(assignments))
}

export async function getToiletsForProvider(providerId: string): Promise<Toilet[]> {
  const [toilets, assignments] = await Promise.all([getToilets(), getProviderAssignments()])
  const ids = assignments[providerId] || []
  return toilets.filter(t => ids.includes(t.id))
} 