import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setSession: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem("nova_user");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("nova_token");
  });

  useEffect(() => {
    if (user && token) {
      localStorage.setItem("nova_user", JSON.stringify(user));
      localStorage.setItem("nova_token", token);
    } else {
      localStorage.removeItem("nova_user");
      localStorage.removeItem("nova_token");
    }
  }, [user, token]);

  const setSession = (newUser: AuthUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// The context hook is intentionally colocated with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}