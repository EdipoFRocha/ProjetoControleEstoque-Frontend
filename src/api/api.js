import axios from "axios";
import { emitUnauthorized } from "@/api/authEvents";

// Base URL (ENV ou fallback)
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";
console.log("API baseURL =", baseURL);

export const api = axios.create({
    baseURL,
    withCredentials: true,
});

// === util pra ler cookie simples (mantido)
function getCookie(name) {
    return document.cookie
        .split("; ")
        .find((row) => row.startsWith(name + "="))
        ?.split("=")[1];
}

// --- Interceptor de REQUEST: injeta X-XSRF-TOKEN em métodos não idempotentes ---
api.interceptors.request.use((config) => {
    const method = (config.method || "get").toLowerCase();
    if (["post", "put", "patch", "delete"].includes(method)) {
        const token = getCookie("XSRF-TOKEN");
        if (token) {
            config.headers["X-XSRF-TOKEN"] = token;
        }
    }
    return config;
});

// REFRESH AUTOMÁTICO DO JWT (só tenta 1x por requisição)
let isRefreshing = false;

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url;

    console.error("API error:", status, url);

    if (status === 401) {
      emitUnauthorized();
    }

    return Promise.reject(err);
  }
);

// ===== Helpers =====
export function extractApiError(err) {
    if (!err) return "Erro desconhecido";
    const data = err?.response?.data;
    if (typeof data === "string") return data;
    return data?.error || data?.message || err?.message || "Erro ao comunicar com o servidor";
}

// ===== Auth =====
export const login = (payload) => api.post("/auth/login", payload);
export const getMe = () => api.get("/auth/me");
export const logout = () => api.post("/auth/logout");

// ===== Master Data =====
export const getMaterials = () => api.get("/master-data/materials");
export const getWarehouses = () => api.get("/master-data/warehouses");
export const getLocations = (warehouseId) =>
    api.get("/master-data/locations", { params: { warehouseId } });

// ===== Movements / Estoque =====
export const getStockMovements = (params) => api.get("/movements", { params });
export const getStockByMaterial = (materialId) =>
    api.get(`/movements/material/${materialId}/stock`);

// ===== Operações =====
export const postReturn = (payload) => api.post("/operations/returns", payload);
export const postTransfer = (payload) => api.post("/operations/transfers", payload);
export const postTransferByCode = (payload) => api.post("/operations/transfers/by-code", payload);

// ===== Recebimento / Venda =====
export const postReceipt = (payload) => api.post("/receipts", payload);
export const postSale = (payload) => api.post("/sales", payload);

// ===== Users (Admin) =====
export const listUsers = (companyId) =>
  api.get("/admin/users", { params: companyId ? { companyId } : {} });

export const createUser = (payload) => api.post("/admin/users", payload);

export const toggleUserActive = (id, companyId) =>
  api.patch(`/admin/users/${id}/toggle-active`, null, {
    params: companyId ? { companyId } : {},
  });

// ===== Companies (Admin) =====
export const listCompanies = () => api.get("/companies");
export const createCompany = (payload) => api.post("/companies", payload);
export const setCompanyActive = (id, value) =>
  api.patch(`/companies/${id}/active?value=${value}`);
