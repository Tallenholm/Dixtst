export interface FetchJsonOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  timeoutMs?: number
}

export class ApiError extends Error {
  status: number
  body: any
  constructor(status: number, body: any) {
    super(`API request failed with status ${status}`)
    this.status = status
    this.body = body
  }
}

let authToken: string | null = null
export const tokenStore = {
  get: () => authToken,
  set: (t: string | null) => {
    authToken = t
  },
}

export async function fetchJson<T = any>(
  url: string,
  opts: FetchJsonOptions = {}
): Promise<T> {
  const { timeoutMs = 10000, body, headers, ...rest } = opts

  const finalHeaders = new Headers(headers)
  const token = tokenStore.get()
  if (token) finalHeaders.set('Authorization', `Bearer ${token}`)

  let preparedBody: BodyInit | undefined = undefined
  if (body !== undefined && body !== null) {
    if (
      typeof body === 'string' ||
      body instanceof FormData ||
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      ArrayBuffer.isView(body) ||
      body instanceof URLSearchParams
    ) {
      preparedBody = body as any
    } else {
      preparedBody = JSON.stringify(body)
      if (!finalHeaders.has('Content-Type'))
        finalHeaders.set('Content-Type', 'application/json')
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: preparedBody,
      credentials: rest.credentials ?? 'include',
      signal: controller.signal,
    })

    const text = await res.text()
    let data: any = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }

    if (!res.ok) {
      throw new ApiError(res.status, data)
    }

    return data as T
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError(0, 'timeout')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
