import axios from "axios";

const API_BASE = "https://sportech-store.com/sports-match-api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000
});

/*
ENTERPRISE LOADER STATE
*/

const activeRequests = new Set();
let loaderTimeout = null;

const LOADER_DELAY = 600;

function startLoading() {
  window.dispatchEvent(new Event("globalLoadingStart"));
}

function stopLoading() {
  window.dispatchEvent(new Event("globalLoadingEnd"));
}

function finalizeRequest(config) {




  if (!config?.silent && config?.metadata?.requestId) {
    activeRequests.delete(config.metadata.requestId);



    if (activeRequests.size === 0) {
      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
        loaderTimeout = null;
      }
      stopLoading();
    }
  }
}

/*
REQUEST INTERCEPTOR
*/

api.interceptors.request.use((config) => {



  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!(config.data instanceof FormData) && !config.headers["Content-Type"]) {
  config.headers["Content-Type"] = "application/json";
}

  if (!config.silent) {
const requestId = Symbol(config.url);

config.metadata = {
  ...(config.metadata || {}),
  requestId
};

    activeRequests.add(requestId);

    if (activeRequests.size === 1) {
      loaderTimeout = setTimeout(() => {
        loaderTimeout = null;
        startLoading();
      }, LOADER_DELAY);
    }
  }

  return config;
});

/*
REFRESH CONTROL
*/

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

/*
RESPONSE INTERCEPTOR
*/

api.interceptors.response.use(

  (response) => {
    finalizeRequest(response.config);
    return response;
  },

  async (error) => {

    finalizeRequest(error.config || {});

    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    /*
    skip auth endpoints
    */

    if (
      originalRequest.url?.includes("/login") ||
      originalRequest.url?.includes("/register") ||
      originalRequest.url?.includes("/forgot-password") ||
      originalRequest.url?.includes("/reset-password") ||
      originalRequest.url?.includes("/refresh")
    ) {
      return Promise.reject(error);
    }

    /*
    only handle 401
    */

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    /*
    retry protection
    */

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    /*
    refresh already running
    */

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api.request(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const res = await axios.post(
        `${API_BASE}/refresh`,
        { refresh_token: refreshToken }
      );

      const newAccess = res.data.access_token;
      const newRefresh = res.data.refresh_token;

      localStorage.setItem("access_token", newAccess);

      if (newRefresh) {
        localStorage.setItem("refresh_token", newRefresh);
      }

      api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

      onRefreshed(newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;

      return api.request(originalRequest);

    } catch (err) {

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      window.location.replace("/login");

      return Promise.reject(err);

    } finally {
  setTimeout(() => {
    isRefreshing = false;
  }, 0);
}

  }
);

export default api;