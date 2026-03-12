import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const AuthContext = createContext(null);

const SESSION_TOKEN_KEY = "gridx_auth_token";
const SESSION_USER_KEY = "gridx_auth_user";

// Simulated credentials
const VALID_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from sessionStorage
  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
      const storedUser = sessionStorage.getItem(SESSION_USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Failed to restore auth session:", err);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function - simulates authentication
  const login = useCallback(async (username, password) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (
      username === VALID_CREDENTIALS.username &&
      password === VALID_CREDENTIALS.password
    ) {
      // Generate a mock JWT-like token
      const mockToken = `gridx_${btoa(username + ":" + Date.now())}_${Math.random().toString(36).slice(2)}`;
      const userData = {
        id: 1,
        username,
        name: "GRIDx Admin",
        email: "admin@gridx.energy",
        role: "administrator",
        avatar: null,
      };

      setToken(mockToken);
      setUser(userData);
      sessionStorage.setItem(SESSION_TOKEN_KEY, mockToken);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userData));

      return { success: true, user: userData };
    }

    return { success: false, error: "Invalid username or password" };
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
  }, []);

  // Computed authentication state
  const isAuthenticated = useMemo(() => !!token && !!user, [token, user]);

  const contextValue = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      login,
      logout,
    }),
    [user, token, loading, isAuthenticated, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
