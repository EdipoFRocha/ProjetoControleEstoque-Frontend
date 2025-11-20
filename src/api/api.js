// src/api/api.js
import axios from "axios";

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

// ====================================================================
// REFRESH AUTOMÁTICO DO JWT (só tenta 1x por requisição)
let isRefreshing = false;

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const status = err?.response?.status;
        const original = err?.config;

        // Se 401 (token expirado) e ainda não tentamos refresh
        if (status === 401 && !original?._retry) {
            original._retry = true;
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    await api.post("/auth/refresh"); // backend usa cookie HttpOnly REFRESH_TOKEN
                } catch (e) {
                    console.warn("Refresh token falhou:", e?.response?.status);
                    isRefreshing = false;
                    return Promise.reject(err);
                }
                isRefreshing = false;
            }
            // refaz a request original
            return api.request(original);
        }

        console.error("API error:", status, err?.config?.url);
        return Promise.reject(err);
    }
);
// ====================================================================

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
