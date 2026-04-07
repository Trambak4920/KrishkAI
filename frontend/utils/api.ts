import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('auth_token');
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem('auth_token', token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem('auth_token');
}

export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getToken();
  const headers: any = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const url = `${BACKEND_URL}/api${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}
