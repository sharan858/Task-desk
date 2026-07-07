import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }){
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password){
    const { user } = await api.login({ email, password });
    setUser(user);
  }

  async function register(name, email, password){
    const { user } = await api.register({ name, email, password });
    setUser(user);
  }

  async function logout(){
    await api.logout();
    setUser(null);
  }

  async function updateRole(role){
    const { user } = await api.updateRole(role);
    setUser(user);
  }

  async function changePassword(currentPassword, newPassword){
    await api.changePassword({ currentPassword, newPassword });
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateRole, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(){
  return useContext(AuthContext);
}
