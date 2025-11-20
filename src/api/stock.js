// src/api/stock.js
import { api } from "./api";

// Últimos movimentos (histórico)
export function getMovements({ types, limit } = {}) {
    return api.get("/movements", { params: { types, limit } });
}

// Estoque consolidado por material
export function getStock(materialId) {
    return api.get(`/movements/material/${materialId}/stock`);
}

// Devolução / Ajuste (qty > 0 = IN, qty < 0 = OUT)
// Backend: @RequestMapping("/api") + @PostMapping("/returns")
export function postReturn({ materialId, warehouseId, locationId, qty, note }) {
    return api.post(`/returns`, { materialId, warehouseId, locationId, qty, note });
}

// Transferência por IDs
// Backend: @PostMapping("/transfers")
export function postTransfer({ materialId, warehouseId, fromLocationId, toLocationId, qty, note }) {
    return api.post(`/transfers`, { materialId, warehouseId, fromLocationId, toLocationId, qty, note });
}

// Transferência por códigos
// Backend: @PostMapping("/transfers/by-code")
export function postTransferByCode({ materialId, warehouseId, fromLocationCode, toLocationCode, qty, note }) {
    return api.post(`/transfers/by-code`, {
        materialId,
        warehouseId,
        fromLocationCode,
        toLocationCode,
        qty,
        note
    });
}
