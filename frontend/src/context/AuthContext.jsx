import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, setTokens, clearTokens, getToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (token) {
        try {
          const userData = await authAPI.me();
          setUser(userData);
        } catch {
          clearTokens();
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    setTokens(data.access, data.refresh);
    const userData = await authAPI.me();
    setUser(userData);
    localStorage.setItem('sha_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);