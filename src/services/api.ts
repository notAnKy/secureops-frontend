import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8081/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url ?? "";
    const isAuthEndpoint =
      url.includes("/auth/login") || url.includes("/auth/register");

    // Only redirect on 401 from PROTECTED routes, never from login/register
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default api;