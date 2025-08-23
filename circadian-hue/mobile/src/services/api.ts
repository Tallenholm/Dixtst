import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch } from 'expo-ssl-pinning';

const TOKEN_KEY = 'auth_token';

export interface FetchWithAuthOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  certs?: string[]; // certificate names located under assets
}

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 3;

async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.warn('Unable to read auth token', err);
    return null;
  }
}

export async function fetchWithAuth(
  url: string,
  options: FetchWithAuthOptions = {}
): Promise<Response> {
  const token = await getToken();
  const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, certs, ...rest } = options;

  const headers: Record<string, string> = {
    ...(rest.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...rest,
        headers,
        signal: controller.signal,
        ...(certs ? { sslPinning: { certs } } : {}),
      });
      clearTimeout(timer);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries - 1) {
        throw err;
      }
    }
  }
  throw new Error('fetchWithAuth failed');
}


export default fetchWithAuth;

