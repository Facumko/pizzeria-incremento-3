// reporteService.js — INC-03

import { getFacturas } from "./facturaService";

// Convierte un Date a formato LocalDateTime que Spring acepta: "2026-05-13T00:00:00"
const toLocalDateTime = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
};

// ── Pizzas más pedidas ──────────────────────────────────────────────────────
// GET /reportes/pizzas-mas-pedidas?start=&end=
// Devuelve array de { nombre, tipoCoccion, tamanio, total }
export const getPizzasMasPedidas = async (start, end) => {
  const params = new URLSearchParams({
    start: toLocalDateTime(start),
    end:   toLocalDateTime(end),
  });
  const res = await fetch(`/reportes/pizzas-mas-pedidas?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Error al obtener reporte (${res.status})`);
  const data = await res.json();
  // data: [ [nombre, tipoCoccion, tamanio, cantidad], ... ]
  return data.map((row) => ({
    nombre:      row[0],
    tipoCoccion: row[1],
    tamanio:     row[2],
    total:       Number(row[3]),
  }));
};

// ── Ingresos y volumen por período ──────────────────────────────────────────
// Usa el endpoint /factura/traer y filtra por fechaEmision (issuedAt) en el cliente.
// Devuelve { totalIngresos, cantidadPedidos, facturas: [...] }
export const getResumenPeriodo = async (start, end) => {
  const todasLasFacturas = await getFacturas();

  // Filtrar por fecha de EMISIÓN de la factura (no por fecha del pedido)
  const filtradas = todasLasFacturas.filter((f) => {
    if (!f.fechaEmision) return false;
    const fecha = new Date(f.fechaEmision);
    return fecha >= start && fecha <= end;
  });

  const totalIngresos = filtradas.reduce((acc, f) => acc + f.total, 0);

  return {
    totalIngresos,
    cantidadPedidos: filtradas.length,
    facturas: filtradas,   // ya tienen la forma correcta: { id, nroFactura, fechaEmision, total, pedido: {...} }
  };
};