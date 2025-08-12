import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiContextType {
  baseUrl: string;
  setBaseUrl: (url: string) => Promise<void>;
  isConnected: boolean;
  testConnection: () => Promise<boolean>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

const DEFAULT_URL = 'http://localhost:5000'; // Development default
const API_URL_KEY = 'circadian_api_url';

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState(DEFAULT_URL);
  const [isConnected, setIsConnected] = useState(false);

  // Load saved URL on app start
  useEffect(() => {
    loadSavedUrl();
  }, []);

  // Test connection when URL changes
  useEffect(() => {
    testConnection();
  }, [baseUrl]);

  const loadSavedUrl = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem(API_URL_KEY);
      if (savedUrl) {
        setBaseUrlState(savedUrl);
      }
    } catch (error) {
      console.error('Failed to load saved API URL:', error);
    }
  };

  const setBaseUrl = async (url: string) => {
    try {
      // Clean up URL format
      const cleanUrl = url.replace(/\/+$/, ''); // Remove trailing slashes
      setBaseUrlState(cleanUrl);
      await AsyncStorage.setItem(API_URL_KEY, cleanUrl);
    } catch (error) {
      console.error('Failed to save API URL:', error);
      throw error;
    }
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${baseUrl}/api/system/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const connected = response.ok;
      setIsConnected(connected);
      return connected;
    } catch (error) {
      console.log('Connection test failed:', error);
      setIsConnected(false);
      return false;
    }
  };

  return (
    <ApiContext.Provider
      value={{
        baseUrl,
        setBaseUrl,
        isConnected,
        testConnection,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

// API request helper
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string
) {
  const url = `${baseUrl}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}