import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthState {
  phone: string | null;
  role: string | null;
  officeId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface StoredAuth {
  phone: string | null;
  role: string | null;
  officeId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  expiresAt: number; // Expiration timestamp bound to subscription duration
  subscriptionEndDate?: string | null;
}

interface AuthContextType extends AuthState {
  login: (data: { phone: string; role: string; officeId?: string | null; token?: string | null; subscriptionEndDate?: string | null }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'mayyaz_auth';

// Cookie Helper Functions
function setCookie(name: string, value: string, maxAgeSeconds: number) {
  try {
    const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.error('Failed to set cookie', e);
  }
}

function getCookie(name: string): string | null {
  try {
    const matches = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
    );
    return matches ? decodeURIComponent(matches[1]) : null;
  } catch (e) {
    console.error('Failed to get cookie', e);
    return null;
  }
}

function deleteCookie(name: string) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  } catch (e) {
    console.error('Failed to delete cookie', e);
  }
}

function readStoredAuth(): StoredAuth | null {
  const now = Date.now();
  
  // 1. Try reading from localStorage first
  try {
    const fromLocal = localStorage.getItem(AUTH_KEY);
    if (fromLocal) {
      const parsed: StoredAuth = JSON.parse(fromLocal);
      if (parsed.expiresAt && parsed.expiresAt > now) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore error
  }

  // 2. Fallback to reading from document.cookie
  try {
    const fromCookie = getCookie(AUTH_KEY);
    if (fromCookie) {
      const parsed: StoredAuth = JSON.parse(fromCookie);
      if (parsed.expiresAt && parsed.expiresAt > now) {
        // Sync back to localStorage
        localStorage.setItem(AUTH_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (e) {
    // Ignore error
  }

  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous State Initialization prevents redirect flicker on page refresh
  const [authState, setAuthState] = useState<AuthState>(() => {
    const stored = readStoredAuth();
    if (stored) {
      return {
        phone: stored.phone,
        role: stored.role,
        officeId: stored.officeId,
        token: stored.token || null,
        isAuthenticated: true,
        loading: false,
      };
    }
    return {
      phone: null,
      role: null,
      officeId: null,
      token: null,
      isAuthenticated: false,
      loading: false,
    };
  });

  // Verify and sync cookie / localStorage on mount
  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setAuthState({
        phone: stored.phone,
        role: stored.role,
        officeId: stored.officeId,
        token: stored.token || null,
        isAuthenticated: true,
        loading: false,
      });
      // Ensure cookie is set
      const remainingSeconds = Math.max(60, Math.floor((stored.expiresAt - Date.now()) / 1000));
      setCookie(AUTH_KEY, JSON.stringify(stored), remainingSeconds);
    } else {
      localStorage.removeItem(AUTH_KEY);
      deleteCookie(AUTH_KEY);
    }
  }, []);

  const login = (data: { phone: string; role: string; officeId?: string | null; token?: string | null; subscriptionEndDate?: string | null }) => {
    // Calculate expiration: strictly match subscriptionEndDate (month, 3 months, 1 year)
    let expiresAt: number;
    if (data.subscriptionEndDate) {
      const subTime = new Date(data.subscriptionEndDate).getTime();
      if (!isNaN(subTime) && subTime > Date.now()) {
        expiresAt = subTime;
      } else {
        expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // default 30 days
      }
    } else {
      expiresAt = data.role === 'admin'
        ? Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year for admin
        : Date.now() + 90 * 24 * 60 * 60 * 1000; // 90 days default
    }

    const maxAgeSeconds = Math.max(60, Math.floor((expiresAt - Date.now()) / 1000));

    const stateData: AuthState = {
      phone: data.phone,
      role: data.role,
      officeId: data.officeId || null,
      token: data.token || null,
      isAuthenticated: true,
      loading: false,
    };

    const storedData: StoredAuth = {
      phone: data.phone,
      role: data.role,
      officeId: data.officeId || null,
      token: data.token || null,
      isAuthenticated: true,
      expiresAt,
      subscriptionEndDate: data.subscriptionEndDate,
    };

    const serialized = JSON.stringify(storedData);

    // Save synchronously in state, localStorage, and document.cookie
    setAuthState(stateData);
    localStorage.setItem(AUTH_KEY, serialized);
    setCookie(AUTH_KEY, serialized, maxAgeSeconds);
  };

  const logout = () => {
    setAuthState({
      phone: null,
      role: null,
      officeId: null,
      token: null,
      isAuthenticated: false,
      loading: false,
    });
    localStorage.removeItem(AUTH_KEY);
    deleteCookie(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
