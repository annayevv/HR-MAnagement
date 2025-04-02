import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refresh_token")
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Token yenileme işlemi
  const refreshAuthToken = async () => {
    try {
      if (!refreshToken) {
        setError("Token bulunamadı. Giriş yapmanız gerekiyor.");
        return;
      }

      const response = await axios.post(
        "http://192.168.4.72/api/token/refresh/",
        {
          refresh: refreshToken,
        }
      );

      const newAccessToken = response.data.access;
      localStorage.setItem("token", newAccessToken);
      setToken(newAccessToken);
      setIsAuthenticated(true);
      setError(null); // Hata yoksa temizle
    } catch (err) {
      setError("Token yenilenemedi. Lütfen tekrar giriş yapın.");
      console.error(err);
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      navigate("/Login"); // Login sayfasına yönlendir
    }
  };

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated, setToken, refreshAuthToken, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};
