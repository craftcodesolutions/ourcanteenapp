import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

interface User {
  email: string;
  id: string;
  institute: string;
  isOwner: boolean;
  name: string;
  phoneNumber: string;
  studentId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthLoaded: boolean;
  setAuth: (auth: { user: User; token: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthLoaded: false,
  setAuth: async () => { },
  logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        const tokenData = await AsyncStorage.getItem('token');
        if (userData && tokenData) {
          setUser(JSON.parse(userData));
          setToken(tokenData);
        }
      } catch (error) {
        console.error('Failed to load auth from storage:', error);
      } finally {
        setIsAuthLoaded(true);
      }
    };

    loadAuth();
  }, []);

  const setAuth = async ({ user, token }: { user: User; token: string }) => {
    try {
      setUser(user);
      setToken(token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', token);
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');

      router.replace('/(auth)/signin');

    } catch (error) {
      console.error('Failed to clear auth from storage:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthLoaded, setAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;