/**
 * AuthContext
 * -----------
 * Guarda el estado de "app bloqueada / desbloqueada" y re-bloquea
 * automáticamente cuando la app pasa a segundo plano, para que nadie pueda
 * dejarla desbloqueada y luego retomarla sin volver a autenticarse.
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface AuthContextValue {
  isUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState as AppStateStatus);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const wasActive = appState.current === 'active';
      const goingBackground = nextState === 'background' || nextState === 'inactive';
      if (wasActive && goingBackground) {
        setIsUnlocked(false);
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  const value: AuthContextValue = {
    isUnlocked,
    unlock: () => setIsUnlocked(true),
    lock: () => setIsUnlocked(false),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return ctx;
}
