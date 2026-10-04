import axios, { AxiosInstance, AxiosError } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefresh } = res.data;
          Cookies.set("access_token", access_token, { secure: false, sameSite: "lax" });
          Cookies.set("refresh_token", newRefresh, { secure: false, sameSite: "lax" });
          original.headers.Authorization = `Bearer ${access_token}`;
          return api(original);
        } catch {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth endpoints
export const authApi = {
  signup: (data: any) => api.post("/auth/signup", data),
  login: (data: any) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  changePassword: (data: any) => api.post("/auth/change-password", data),
};

// Accounts endpoints
export const accountApi = {
  create: (data: any) => api.post("/accounts", data),
  getMyAccounts: () => api.get("/accounts/me"),
  getAllAccounts: () => api.get("/accounts"),
  getAccount: (accountNumber: string) => api.get(`/accounts/${accountNumber}`),
  updateAccount: (accountNumber: string, data: any) => api.patch(`/accounts/${accountNumber}`, data),
  deleteAccount: (accountNumber: string) => api.delete(`/accounts/${accountNumber}`),
};

// Transactions endpoints
export const transactionApi = {
  deposit: (data: any) => api.post("/transactions/deposit", data),
  withdraw: (data: any) => api.post("/transactions/withdraw", data),
  getHistory: (accountNumber: string, limit = 50, offset = 0) =>
    api.get(`/transactions/account/${accountNumber}?limit=${limit}&offset=${offset}`),
  getFlagged: () => api.get("/transactions/flagged"),
};

// Cards endpoints
export const cardApi = {
  request: (data: any) => api.post("/cards/request", data),
  getMyCards: () => api.get("/cards/me"),
  updateStatus: (cardNumber: string, status: string) =>
    api.patch(`/cards/${cardNumber}/status`, { status }),
  getTransactions: (cardNumber: string) => api.get(`/cards/${cardNumber}/transactions`),
};

// Loans endpoints
export const loanApi = {
  apply: (data: any) => api.post("/loans/apply", data),
  getMyLoans: () => api.get("/loans/me"),
  getAllLoans: () => api.get("/loans"),
  updateStatus: (loanId: string, data: any) => api.patch(`/loans/${loanId}/status`, data),
  getRepaymentSchedule: (loanId: string) => api.get(`/loans/${loanId}/repayment-schedule`),
};

// Feedback endpoints
export const feedbackApi = {
  submit: (data: any) => api.post("/feedback", data),
  getMyFeedback: () => api.get("/feedback/me"),
  getAllFeedback: () => api.get("/feedback"),
};

// Analytics endpoints
export const analyticsApi = {
  dashboard: () => api.get("/analytics/dashboard"),
  monthlyTransactions: () => api.get("/analytics/transactions/monthly"),
  accountDistribution: () => api.get("/analytics/accounts/distribution"),
  userGrowth: () => api.get("/analytics/users/growth"),
};
