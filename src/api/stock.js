import { api } from "./api";

export function getMovements({ types, limit, size, page } = {}) {
  const params = {};

  if (types) params.types = types;

  const finalSize = size ?? limit;
  if (finalSize != null) {
    params.limit = finalSize;
    params.size = finalSize;
  }

  if (page != null) params.page = page;

  return api.get("/movements", { params });
}

export function getAdjustments({ limit = 500 } = {}) {
  return getMovements({
    types: "ADJUSTMENT_IN,ADJUSTMENT_OUT",
    limit,
  });
}
// Estoque consolidado por material
export function getStock(materialId) {
    return api.get(`/movements/material/${materialId}/stock`);
}

export function postReturn({ materialId, warehouseId, locationId, qty, note }) {
  return api.post(`/returns`, { materialId, warehouseId, locationId, qty, note });
}

// Transferência por IDs
export function postTransfer({ materialId, warehouseId, fromLocationId, toLocationId, qty, note }) {
    return api.post(`/transfers`, { materialId, warehouseId, fromLocationId, toLocationId, qty, note });
}

// Transferência por códigos
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
