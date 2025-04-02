import { createContext, useState, useContext, useEffect } from "react";
import api from "../api/apifor";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("v1/auth/login");
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem("v1/auth/token");
      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await api.post("/v1/auth/token", {
        refresh: storedRefreshToken,
      });

      const { access } = response.data;
      localStorage.setItem("v1/auth/login", access);
      return access;
    } catch (error) {
      console.error("Error refreshing token:", error);
      logout();
      return null;
    }
  };

  const login = async (login, password) => {
    setLoading(true);
    try {
      const tokenResponse = await api.post("/v1/auth/login", {
        login,
        password,
      });

      localStorage.setItem(
        "v1/auth/login",
        tokenResponse.data.data.accessToken
      );
      localStorage.setItem(
        "v1/auth/token",
        tokenResponse.data.data.refreshToken
      );

      console.log("Token stored:", tokenResponse.data.data.accessToken);

      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Login error response data:", error.response?.data);
      console.error("Login error:", error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("v1/auth/login");
    localStorage.removeItem("v1/auth/token");
    setIsAuthenticated(false);
  };

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && !error.config._retry) {
        error.config._retry = true;
        try {
          const newToken = await refreshToken();
          if (newToken) {
            error.config.headers["Authorization"] = `Bearer ${newToken}`;
            return api(error.config);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
