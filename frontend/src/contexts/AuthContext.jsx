import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar sessão existente do localStorage ao inicializar
    const storedToken = localStorage.getItem('@SorteioMaster:token');
    const storedUser = localStorage.getItem('@SorteioMaster:user');

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('@SorteioMaster:token');
        localStorage.removeItem('@SorteioMaster:user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (usuario, senha) => {
    try {
      const response = await api.post('/auth/login', { usuario, senha });
      const { token, usuario: userData } = response.data;

      localStorage.setItem('@SorteioMaster:token', token);
      localStorage.setItem('@SorteioMaster:user', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.error ||
        'Não foi possível conectar ao servidor. Verifique se a API está online.';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('@SorteioMaster:token');
    localStorage.removeItem('@SorteioMaster:user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
