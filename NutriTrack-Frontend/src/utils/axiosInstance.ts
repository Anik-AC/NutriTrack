import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { BACKEND_URL } from './env';

const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // if you're using cookies/sessions
  headers: {
    'Content-Type': 'application/json',
  },
});

const getStoredUser = () => JSON.parse(localStorage.getItem("loggedUser") || "{}");

const logoutAndRedirect = () => {
  localStorage.removeItem("loggedUser");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/"; // Redirect user to the homepage
};

// Intercept requests to attach the token (proactive-expiry logout removed in favor
// of the refresh flow below, so a soon-to-expire token still gets a chance to refresh).
axiosInstance.interceptors.request.use((config) => {
  const user = getStoredUser();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

/**
 * Single-flight token refresh: when several requests 401 at once, only one hits
 * `/api/auth/refresh-token`; the rest await the same promise, then retry.
 */
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const user = getStoredUser();
  if (!user?.token) return null;
  try {
    // Bare axios (no interceptors) to avoid a refresh→401→refresh loop.
    const { data } = await axios.post(`${BACKEND_URL}/api/auth/refresh-token`, { token: user.token });
    const newToken: string | undefined = data?.token;
    if (!newToken) return null;

    const expiresInSec: number = data?.expiresIn ?? 3600;
    const updated = { ...user, token: newToken, tokenExpiry: Date.now() + expiresInSec * 1000 };
    localStorage.setItem("loggedUser", JSON.stringify(updated));
    localStorage.setItem("token", newToken);
    return newToken;
  } catch {
    return null;
  }
};

// Handle API errors globally, with one automatic refresh+retry on 401.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;

      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return axiosInstance(original);
      }

      console.log("Unauthorized and refresh failed! Logging out...");
      logoutAndRedirect();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
