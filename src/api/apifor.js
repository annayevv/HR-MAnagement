import axios from "axios";

export const getStoredToken = () => localStorage.getItem("v1/auth/login");
export const getStoredRefreshToken = () =>
  localStorage.getItem("v1/auth/token");

const api = axios.create({
  baseURL: "http://192.168.4.58/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const refreshAuthToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const response = await axios.post("http://192.168.4.58/api/v1/auth/token", {
      refresh: refreshToken,
    });

    localStorage.setItem("token", response.data.access);
    return response.data.access;
  } catch (error) {
    console.error("Error refreshing token:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

    throw error;
  }
};

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const newToken = await refreshAuthToken();
        error.config.headers["Authorization"] = `Bearer ${newToken}`;
        return api(error.config);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
