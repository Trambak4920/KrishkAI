import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  token: string | null;
  user: any;
  language: string;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
  setLanguage: (lang: string) => void;
  setUser: (user: any) => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  language: 'en',
  setAuth: () => {},
  logout: () => {},
  setLanguage: () => {},
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [language, setLang] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const savedToken = await AsyncStorage.getItem('auth_token');
      const savedUser = await AsyncStorage.getItem('auth_user');
      const savedLang = await AsyncStorage.getItem('app_language');
      if (savedToken) setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedLang) setLang(savedLang);
      setLoading(false);
    })();
  }, []);

  const setAuth = async (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
  };

  const setLanguage = async (lang: string) => {
    setLang(lang);
    await AsyncStorage.setItem('app_language', lang);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ token, user, language, setAuth, logout, setLanguage, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
