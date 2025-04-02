import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.4.58/api/v1/auth/login",
});

export const refreshAuthToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const response = await axios.post(
      "http://192.168.4.58/api/v1/auth/login/token/refresh/",
      {
        refresh: refreshToken,
      }
    );

    localStorage.setItem("token", response.data.access);
    return response.data.access;
  } catch (error) {
    console.error("Error refreshing token:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

    throw error;
  }
};

axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error("Error while attaching token to the request:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error("Request interception failed:", error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const newToken = await refreshAuthToken();
        error.config.headers["Authorization"] = `Bearer ${newToken}`;
        return axiosInstance(error.config);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
